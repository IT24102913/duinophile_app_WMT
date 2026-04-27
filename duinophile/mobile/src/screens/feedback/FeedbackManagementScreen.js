import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function FeedbackManagementScreen() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await api.get('/feedback');
      setFeedbacks(res.data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFeedbacks();
    }, [fetchFeedbacks])
  );

  const handleAction = (feedbackId, action) => {
    const actionText = action === 'APPROVE' ? 'approve' : 'delete';
    showAlert(
      `${action === 'APPROVE' ? 'Approve' : 'Delete'} Feedback`,
      `Are you sure you want to ${actionText} this feedback?`,
      action === 'APPROVE' ? 'INFO' : 'DELETE',
      async () => {
        try {
          if (action === 'APPROVE') {
            await api.post(`/feedback/${feedbackId}/approve`);
            showAlert('Done', 'Feedback approved.', 'SUCCESS');
          } else {
            await api.delete(`/feedback/${feedbackId}`);
            showAlert('Done', 'Feedback deleted.', 'SUCCESS');
          }
          fetchFeedbacks();
        } catch (err) {
          showAlert('Error', err.message, 'ERROR');
        }
      }
    );
  };

  const renderFeedback = ({ item }) => (
    <View style={[styles.feedbackCard, item.status === 'PENDING' && styles.cardPending]}>
      <View style={styles.feedbackHeader}>
        <Text style={styles.feedbackLabel}>
          {item.status === 'PENDING' ? '⏳ Pending' : '✅ Approved'} Feedback
        </Text>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Course:</Text>
        <Text style={styles.infoValue}>{item.courseId?.title || 'Unknown Course'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Author:</Text>
        <Text style={styles.infoValue}>{item.username}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Rating:</Text>
        <Text style={styles.infoValue}>{'⭐'.repeat(item.rating)}</Text>
      </View>

      <View style={styles.contentBox}>
        <Text style={styles.contentLabel}>FEEDBACK CONTENT</Text>
        <Text style={styles.contentText}>{item.content}</Text>
      </View>

      <View style={styles.actionRow}>
        {item.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => handleAction(item._id, 'APPROVE')}
          >
            <Text style={styles.approveBtnText}>✅ Approve</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleAction(item._id, 'DELETE')}
        >
          <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>⭐ Feedback Management</Text>
      <Text style={styles.subtitle}>Review course feedbacks</Text>
      <FlatList
        data={feedbacks}
        keyExtractor={(item) => item._id}
        renderItem={renderFeedback}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeedbacks(); }} tintColor="#6C63FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyText}>No feedbacks found!</Text>
            <Text style={styles.emptySubtext}>There is no feedback to review at the moment.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
        onCancel={
          ['DELETE', 'INFO'].includes(alertConfig.type) && 
          (alertConfig.title.includes('Are you sure') || alertConfig.title.includes('Feedback')) 
          ? () => setAlertConfig({ ...alertConfig, visible: false }) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0F0F23', padding: 16 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' },
  heading:         { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle:        { color: '#888', fontSize: 13, marginBottom: 16 },
  feedbackCard:    { backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#4CAF50' },
  cardPending:     { borderColor: '#FF9800' },
  feedbackHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feedbackLabel:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  dateText:        { color: '#666', fontSize: 11 },
  infoRow:         { flexDirection: 'row', gap: 6, marginBottom: 6 },
  infoLabel:       { color: '#888', fontSize: 13, width: 60 },
  infoValue:       { color: '#fff', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  contentBox:      { backgroundColor: '#0F0F23', borderRadius: 10, padding: 12, marginVertical: 8, borderLeftWidth: 3, borderLeftColor: '#6C63FF' },
  contentLabel:    { color: '#6C63FF', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  contentText:     { color: '#ccc', lineHeight: 20 },
  actionRow:       { flexDirection: 'row', gap: 10, marginTop: 10 },
  approveBtn:      { flex: 1, backgroundColor: '#1A3A1A', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  approveBtnText:  { color: '#4CAF50', fontWeight: 'bold', fontSize: 14 },
  deleteBtn:       { flex: 1, backgroundColor: '#3A1A1A', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  deleteBtnText:   { color: '#F44336', fontWeight: 'bold', fontSize: 14 },
  emptyBox:        { alignItems: 'center', marginTop: 60 },
  emptyEmoji:      { fontSize: 48, marginBottom: 12 },
  emptyText:       { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySubtext:    { color: '#888', fontSize: 14, marginTop: 4 },
});
