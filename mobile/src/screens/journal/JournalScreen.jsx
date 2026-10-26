import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import JournalCard from './components/JournalCard';
import JournalEntryModal from './components/JournalEntryModal';
import JournalDetailModal from './components/JournalDetailModal';
import { journalApi } from '../../api/journalApi';
import { cacheManager } from '../../storage/cacheManager';
import { syncQueue } from '../../storage/syncQueue';
import { networkMonitor } from '../../sync/networkMonitor';
import { uploadImageFile } from '../../api/imageUpload';
import {
  Search,
  SlidersHorizontal,
  Plus,
  FileText,
  Quote,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

function JournalScreen({ navigation }) {
  const [journals, setJournals] = useState([]);
  const [activeTab, setActiveTab] = useState('note'); // 'note' | 'quote'
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedJournal, setSelectedJournal] = useState(null);

  const loadJournals = async () => {
    try {
      const cached = (await cacheManager.getJournals()) || [];
      if (Array.isArray(cached) && cached.length > 0) {
        setJournals(cached);
      }

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        const res = await journalApi.getJournals();
        const serverData = res.data?.data || [];

        // Smart reconciliation:
        // 1. Keep pending local notes that haven't synced yet (e.g. _id starts with local_)
        // 2. If a cached note has an image and the server version returned empty image, preserve the cached image!
        const localPending = cached.filter((c) => c._id && c._id.startsWith('local_'));
        const mergedServer = serverData.map((serverItem) => {
          const cachedMatch = cached.find((c) => c._id === serverItem._id);
          if (cachedMatch && cachedMatch.image && !serverItem.image) {
            return { ...serverItem, image: cachedMatch.image };
          }
          return serverItem;
        });

        const merged = [
          ...localPending,
          ...mergedServer.filter((s) => !localPending.some((l) => l._id === s._id)),
        ];
        setJournals(merged);
        await cacheManager.setJournals(merged);
      }
    } catch (err) {
      console.warn('Error loading journals:', err?.message);
    }
  };

  useEffect(() => {
    loadJournals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJournals();
    setRefreshing(false);
  };

  const handleSaveEntry = async (entryData) => {
    let finalData = { ...entryData };

    if (editingItem) {
      // Update local state and cache immediately so user sees changes instantly
      const updated = journals.map((j) => (j._id === editingItem._id ? { ...j, ...finalData } : j));
      setJournals(updated);
      await cacheManager.setJournals(updated);

      if (selectedJournal && selectedJournal._id === editingItem._id) {
        setSelectedJournal({ ...selectedJournal, ...finalData });
      }

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        if (
          finalData.image &&
          (finalData.image.startsWith('file://') || finalData.image.startsWith('content://'))
        ) {
          try {
            const cloudUrl = await uploadImageFile(finalData.image);
            if (cloudUrl) {
              finalData.image = cloudUrl;
              const reconciled = journals.map((j) =>
                j._id === editingItem._id ? { ...j, ...finalData } : j
              );
              setJournals(reconciled);
              await cacheManager.setJournals(reconciled);
            }
          } catch {}
        }

        await journalApi.updateJournal(editingItem._id, finalData).catch(async () => {
          await syncQueue.enqueue({
            endpoint: `/api/journals/${editingItem._id}`,
            method: 'PUT',
            payload: finalData,
          });
        });
      } else {
        await syncQueue.enqueue({
          endpoint: `/api/journals/${editingItem._id}`,
          method: 'PUT',
          payload: finalData,
        });
      }
    } else {
      // Create: Save locally first for instant feedback inside phone
      const tempId = `local_${Date.now()}`;
      const newEntry = {
        _id: tempId,
        ...finalData,
        createdAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...journals];
      setJournals(updated);
      await cacheManager.setJournals(updated);

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        if (
          finalData.image &&
          (finalData.image.startsWith('file://') || finalData.image.startsWith('content://'))
        ) {
          try {
            const cloudUrl = await uploadImageFile(finalData.image);
            if (cloudUrl) {
              finalData.image = cloudUrl;
              newEntry.image = cloudUrl;
              const reconciled = updated.map((j) => (j._id === tempId ? newEntry : j));
              setJournals(reconciled);
              await cacheManager.setJournals(reconciled);
            }
          } catch {}
        }

        try {
          const res = await journalApi.createJournal(finalData);
          if (res.data?.data) {
            const serverEntry = res.data.data;
            if (!serverEntry.image && finalData.image) {
              serverEntry.image = finalData.image;
            }
            const reconciled = updated.map((j) => (j._id === tempId ? serverEntry : j));
            setJournals(reconciled);
            await cacheManager.setJournals(reconciled);
          }
        } catch {
          await syncQueue.enqueue({
            endpoint: '/api/journals',
            method: 'POST',
            payload: finalData,
          });
        }
      } else {
        await syncQueue.enqueue({
          endpoint: '/api/journals',
          method: 'POST',
          payload: finalData,
        });
      }
    }
    setEditingItem(null);
  };

  const handleDelete = async (id) => {
    const updated = journals.filter((j) => j._id !== id);
    setJournals(updated);
    await cacheManager.setJournals(updated);

    if (selectedJournal && selectedJournal._id === id) {
      setSelectedJournal(null);
    }

    const isOnline = await networkMonitor.checkConnection();
    if (isOnline) {
      await journalApi.deleteJournal(id).catch(async () => {
        await syncQueue.enqueue({
          endpoint: `/api/journals/${id}`,
          method: 'DELETE',
        });
      });
    } else {
      await syncQueue.enqueue({
        endpoint: `/api/journals/${id}`,
        method: 'DELETE',
      });
    }
  };

  const filtered = journals.filter((item) => {
    const matchesTab = item.type === activeTab;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesTab && matchesQuery;
  });

  return (
    <View className="flex-1 bg-momentum-bg">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00E676"
            colors={['#00E676']}
          />
        }
        ListHeaderComponent={
          <>
            {/* Title & + New Button Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-2xl font-bold text-white tracking-tight"
                >
                  Journal
                </Text>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-xs text-momentum-textSecondary mt-0.5"
                >
                  Capture ideas, thoughts and quotes.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
                activeOpacity={0.8}
                className="bg-momentum-emerald px-3.5 py-1.5 rounded-xl flex-row items-center gap-1.5"
              >
                <Plus size={14} color="#000000" strokeWidth={3} />
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-xs font-bold text-black font-sans"
                >
                  New
                </Text>
              </TouchableOpacity>
            </View>

            {/* Segmented Notes / Quotes Toggle */}
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={() => setActiveTab('note')}
                activeOpacity={0.8}
                className={`flex-1 py-3 rounded-2xl border flex-row items-center justify-center gap-2 ${activeTab === 'note'
                    ? 'bg-[#0B140E] border-momentum-emerald'
                    : 'bg-momentum-card border-momentum-border'
                  }`}
              >
                <FileText
                  size={16}
                  color={activeTab === 'note' ? colors.emerald.bright : colors.text.muted}
                />
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className={`text-sm font-bold ${activeTab === 'note' ? 'text-white' : 'text-momentum-textSecondary'
                    }`}
                >
                  Notes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('quote')}
                activeOpacity={0.8}
                className={`flex-1 py-3 rounded-2xl border flex-row items-center justify-center gap-2 ${activeTab === 'quote'
                    ? 'bg-[#0B140E] border-momentum-emerald'
                    : 'bg-momentum-card border-momentum-border'
                  }`}
              >
                <Quote
                  size={16}
                  color={activeTab === 'quote' ? colors.emerald.bright : colors.text.muted}
                />
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className={`text-sm font-bold ${activeTab === 'quote' ? 'text-white' : 'text-momentum-textSecondary'
                    }`}
                >
                  Quotes
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search & Filter Bar */}
            <View className="flex-row items-center gap-2.5 mb-4">
              <View className="flex-1 flex-row items-center bg-momentum-card border border-momentum-border rounded-xl px-3.5 py-2.5">
                <Search size={15} color={colors.text.muted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={`Search ${activeTab === 'note' ? 'notes' : 'quotes'}...`}
                  placeholderTextColor={colors.text.muted}
                  className="flex-1 text-xs text-white ml-2 py-0"
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                className="w-10 h-10 rounded-xl bg-momentum-card border border-momentum-border items-center justify-center"
              >
                <SlidersHorizontal size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <JournalCard
            item={item}
            onPress={(j) => setSelectedJournal(j)}
            onEdit={(j) => {
              setEditingItem(j);
              setIsModalOpen(true);
            }}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View className="py-12 px-6 items-center justify-center bg-momentum-card border border-dashed border-momentum-border rounded-2xl my-2">
            <View className="w-12 h-12 rounded-full bg-[#0D241C] items-center justify-center mb-3">
              {activeTab === 'note' ? (
                <FileText size={22} color="#00E676" strokeWidth={2.2} />
              ) : (
                <Quote size={22} color="#00E676" strokeWidth={2.2} />
              )}
            </View>
            <Text className="text-sm font-bold text-white mb-1">
              No {activeTab === 'note' ? 'notes' : 'quotes'} yet
            </Text>
            <Text className="text-xs text-momentum-textSecondary text-center max-w-[260px] mb-4 leading-4">
              {activeTab === 'note'
                ? 'Capture your insights, lessons learned, and system design notes.'
                : 'Save inspiring mantras and wisdom that drive your daily momentum.'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              activeOpacity={0.8}
              className="bg-momentum-emerald px-4 py-2 rounded-xl flex-row items-center gap-1.5"
            >
              <Plus size={14} color="#000000" strokeWidth={3} />
              <Text className="text-xs font-bold text-black font-sans">
                Create {activeTab === 'note' ? 'Note' : 'Quote'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Big Screen Detail Modal Popup */}
      <JournalDetailModal
        visible={Boolean(selectedJournal)}
        item={selectedJournal}
        onClose={() => setSelectedJournal(null)}
        onEdit={(j) => {
          setSelectedJournal(null);
          setEditingItem(j);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      {/* Create / Edit Modal */}
      <JournalEntryModal
        visible={isModalOpen}
        initialData={editingItem}
        defaultType={activeTab}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEntry}
      />
    </View>
  );
}

export default React.memo(JournalScreen);
