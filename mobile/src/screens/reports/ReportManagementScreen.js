import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, SafeAreaView, LayoutAnimation
} from 'react-native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function ReportManagementScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  // Pagination support
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const fetchReports = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    try {
      const res = await api.get(`/reports?page=${pageNum}&limit=10`);
      const newReports = res.data.reports || [];
      const apiReports = Array.isArray(res.data) ? res.data : newReports;

      if (shouldRefresh) {
        setReports(apiReports);
      } else {
        setReports(prev => [...prev, ...apiReports]);
      }

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

  const handleResolve = (reportId, action) => {
    const isAccept = action === 'ACCEPT';
    showAlert(
      isAccept ? 'Accept Report' : 'Reject Report',
      isAccept 
        ? 'Are you sure you want to accept this report and permanently delete the comment?' 
        : 'Are you sure you want to reject this report? The comment will remain.',
      isAccept ? 'DELETE' : 'INFO',
      async () => {
        setResolvingId(reportId);
        try {
          await api.put(`/reports/${reportId}/resolve`, { action });
          
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setReports(prev => prev.filter(r => r._id !== reportId));
          
          showAlert(
            'Success', 
            isAccept ? 'Report accepted and comment deleted.' : 'Report rejected.',
            'SUCCESS'
          );
        } catch (err) {
          showAlert('Error', err.response?.data?.error || 'Failed to resolve report', 'ERROR');
        } finally {
          setResolvingId(null);
        }
      }
    );
  };

  const renderReport = ({ item }) => {
    const isResolving = resolvingId === item._id;

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.iconWarning}>⚠️</Text>
            <Text style={styles.reportLabel}>Pending Review</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.usersContainer}>
          <View style={styles.userRow}>
            <Text style={styles.userLabel}>Reporter:</Text>
            <Text style={styles.userValue}>{item.reporterName}</Text>
          </View>
          <View style={styles.userRow}>
            <Text style={styles.userLabel}>Author:</Text>
            <Text style={styles.userValue}>{item.commentAuthorName || 'Unknown User'}</Text>
          </View>
        </View>

        <View style={styles.commentBox}>
          <Text style={styles.boxLabel}>REPORTED COMMENT</Text>
          <Text style={styles.commentText}>"{item.commentContent}"</Text>
        </View>

        <View style={styles.reasonBox}>
          <Text style={[styles.boxLabel, styles.reasonBoxLabel]}>REASON FOR REPORT</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn, isResolving && styles.btnDisabled]}
            onPress={() => handleResolve(item._id, 'ACCEPT')}
            disabled={isResolving}
            activeOpacity={0.7}
          >
            {isResolving ? <ActivityIndicator size="small" color="#4CAF50" /> : <Text style={styles.acceptBtnText}>✅ Delete Comment</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn, isResolving && styles.btnDisabled]}
            onPress={() => handleResolve(item._id, 'REJECT')}
            disabled={isResolving}
            activeOpacity={0.7}
          >
            {isResolving ? <ActivityIndicator size="small" color="#FF5252" /> : <Text style={styles.rejectBtnText}>❌ Reject Report</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>Moderation Queue</Text>
          <Text style={styles.subtitle}>Review and resolve pending community reports</Text>
        </View>

        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderReport}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6C63FF" />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore && <ActivityIndicator size="small" color="#6C63FF" style={{ marginVertical: 20 }} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyEmoji}>✨</Text>
              </View>
              <Text style={styles.emptyText}>Queue is empty</Text>
              <Text style={styles.emptySubtext}>All reports have been reviewed and resolved. Great job keeping the community safe!</Text>
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
          onCancel={
            ['DELETE', 'INFO'].includes(alertConfig.type) && 
            (alertConfig.title.includes('Accept') || alertConfig.title.includes('Reject'))
            ? () => setAlertConfig(prev => ({ ...prev, visible: false })) : null
          }
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
    borderColor: '#3A2E1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconWarning: { fontSize: 16 },
  reportLabel: { color: '#FFB84D', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  dateText: { color: '#888899', fontSize: 12, fontWeight: '500' },
  
  usersContainer: { backgroundColor: '#12121D', borderRadius: 10, padding: 12, marginBottom: 12 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  userLabel: { color: '#888899', fontSize: 13, fontWeight: '500' },
  userValue: { color: '#E0E0E0', fontSize: 13, fontWeight: '600' },
  
  commentBox: { backgroundColor: '#12121D', borderRadius: 10, padding: 14, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#FF5252' },
  reasonBox: { backgroundColor: '#12121D', borderRadius: 10, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#FFB84D' },
  
  boxLabel: { color: '#FF5252', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  reasonBoxLabel: { color: '#FFB84D' },
  
  commentText: { color: '#E0E0E0', lineHeight: 22, fontSize: 14, fontStyle: 'italic' },
  reasonText: { color: '#FFFFFF', lineHeight: 22, fontSize: 15 },
  
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  acceptBtn: { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: '#4CAF50' },
  rejectBtn: { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: '#FF5252' },
  btnDisabled: { opacity: 0.5 },
  
  acceptBtnText: { color: '#4CAF50', fontWeight: '700', fontSize: 14 },
  rejectBtnText: { color: '#FF5252', fontWeight: '700', fontSize: 14 },
  
  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1E2E', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptySubtext: { color: '#888899', fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: '80%' },
});
