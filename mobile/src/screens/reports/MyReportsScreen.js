import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, 
  TextInput, TouchableOpacity, SafeAreaView
} from 'react-native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function MyReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const [editingReason, setEditingReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  // Pagination state (for future proofing, backend supports it)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const fetchReports = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    try {
      const res = await api.get(`/reports/my?page=${pageNum}&limit=10`);
      const newReports = res.data.reports || []; // Handle wrapped response
      const apiReports = Array.isArray(res.data) ? res.data : newReports;
      
      if (shouldRefresh) {
        setReports(apiReports);
      } else {
        setReports(prev => [...prev, ...apiReports]);
      }
      
      // Update pagination state if backend sends it
      if (res.data.pagination) {
        setHasMore(res.data.pagination.page < res.data.pagination.pages);
      } else {
        setHasMore(apiReports.length === 10);
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to load reports', 'ERROR');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReports(1, true);
    }, [fetchReports])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchReports(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReports(nextPage);
    }
  };

  const handleDelete = (reportId) => {
    showAlert(
      'Delete Report',
      'Are you sure you want to withdraw your report?',
      'DELETE',
      async () => {
        try {
          await api.delete(`/reports/${reportId}`);
          setReports(prev => prev.filter(r => r._id !== reportId));
        } catch (err) {
          showAlert('Error', err.response?.data?.error || 'Failed to delete report', 'ERROR');
        }
      }
    );
  };

  const handleEdit = (report) => {
    setEditingReportId(report._id);
    setEditingReason(report.reason);
  };

  const saveEdit = async (reportId) => {
    if (editingReason.trim().length < 5) {
      return showAlert('Validation Error', 'Reason must be at least 5 characters.', 'ERROR');
    }
    
    setSavingEdit(true);
    try {
      const res = await api.put(`/reports/${reportId}`, { reason: editingReason.trim() });
      setReports(prev => prev.map(r => r._id === reportId ? res.data.report || { ...r, reason: editingReason.trim() } : r));
      setEditingReportId(null);
      setEditingReason('');
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to update report', 'ERROR');
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDING':  return { color: '#FFB84D', bgColor: 'rgba(255, 184, 77, 0.1)', icon: '⏳', label: 'Pending' };
      case 'ACCEPTED': return { color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.1)', icon: '✅', label: 'Accepted' };
      case 'REJECTED': return { color: '#FF5252', bgColor: 'rgba(255, 82, 82, 0.1)', icon: '❌', label: 'Rejected' };
      default: return { color: '#888', bgColor: 'rgba(136, 136, 136, 0.1)', icon: '❓', label: 'Unknown' };
    }
  };

  const renderReport = ({ item }) => {
    const isEditing = editingReportId === item._id;
    const statusConfig = getStatusConfig(item.status);

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportLabel}>Reported Comment</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
              {statusConfig.icon} {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Author:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.commentAuthorName || 'Unknown User'}</Text>
        </View>

        <View style={styles.commentBox}>
          <Text style={styles.commentText}>"{item.commentContent}"</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Your Reason:</Text>
        </View>
        
        {isEditing ? (
          <View style={styles.editWrap}>
            <TextInput
              style={styles.textInput}
              value={editingReason}
              onChangeText={setEditingReason}
              multiline
              autoFocus
              maxLength={500}
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingReportId(null)} disabled={savingEdit}>
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingEdit && { opacity: 0.7 }]} onPress={() => saveEdit(item._id)} disabled={savingEdit}>
                {savingEdit ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnTextSave}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.reasonText}>{item.reason}</Text>
            {item.status === 'PENDING' && (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.editBtn]} onPress={() => handleEdit(item)} activeOpacity={0.7}>
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => handleDelete(item._id)} activeOpacity={0.7}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>My Reports</Text>
          <Text style={styles.subtitle}>Track the status of comments you've reported</Text>
        </View>

        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderReport}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6C63FF" colors={['#6C63FF']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore && <ActivityIndicator size="small" color="#6C63FF" style={{ marginVertical: 20 }} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyText}>When you report a comment, it will appear here so you can track its status.</Text>
            </View>
          }
          contentContainerStyle={[styles.listContent, reports.length === 0 && styles.emptyListContent]}
        />

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onConfirm={() => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            if (alertConfig.onConfirm) alertConfig.onConfirm();
          }}
          onCancel={alertConfig.type === 'DELETE' ? () => setAlertConfig(prev => ({ ...prev, visible: false })) : null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F0F23' },
  container: { flex: 1, backgroundColor: '#0F0F23', paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' },
  headerContainer: { marginTop: 16, marginBottom: 24 },
  heading: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#888899', marginTop: 4 },
  listContent: { paddingBottom: 30 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  
  reportCard: { 
    backgroundColor: '#1E1E2E', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#2A2A3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  reportLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontWeight: '700', fontSize: 12 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoLabel: { color: '#888899', fontSize: 13, fontWeight: '500' },
  infoValue: { color: '#E0E0E0', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  
  commentBox: { backgroundColor: '#12121D', borderRadius: 10, padding: 14, marginVertical: 12, borderLeftWidth: 3, borderLeftColor: '#33334D' },
  commentText: { color: '#B0B0C0', fontStyle: 'italic', lineHeight: 22, fontSize: 14 },
  
  reasonText: { color: '#FFFFFF', lineHeight: 22, fontSize: 15, marginBottom: 12 },
  dateText: { color: '#666677', fontSize: 12, marginTop: 4, fontWeight: '500' },
  
  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#888899', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  
  editWrap: { marginVertical: 10 },
  textInput: { 
    backgroundColor: '#12121D', 
    color: '#FFFFFF', 
    borderRadius: 12, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: '#6C63FF', 
    minHeight: 80, 
    textAlignVertical: 'top',
    fontSize: 15
  },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 12, justifyContent: 'flex-end' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 4, justifyContent: 'flex-end' },
  
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignItems: 'center', minWidth: 80 },
  saveBtn: { backgroundColor: '#6C63FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#444455', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  editBtn: { backgroundColor: 'rgba(108, 99, 255, 0.1)', borderWidth: 1, borderColor: '#6C63FF' },
  deleteBtn: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderWidth: 1, borderColor: '#FF5252' },
  
  btnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  btnTextSave: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  btnTextCancel: { color: '#A0A0B0', fontWeight: '600', fontSize: 14 },
});
