import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/common/CustomAlert';

export default function FeedbackScreen({ route }) {
  const { courseId } = route.params;
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [content,   setContent]   = useState('');
  const [rating,    setRating]    = useState(5);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [editingId, setEditingId] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    try {
      const res = await api.get(`/feedback/course/${courseId}`);
      setFeedbacks(res.data);
    } catch (err) {
      showAlert('Error', err.message, 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (content.trim().length < 10) {
      showAlert('Validation', 'Feedback must be at least 10 characters.', 'ERROR'); return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/feedback/${editingId}`, { content: content.trim(), rating });
        showAlert('Success', 'Feedback updated. Pending approval.', 'SUCCESS');
        setEditingId(null);
      } else {
        await api.post('/feedback', { content: content.trim(), rating, courseId });
        showAlert('Thank you!', 'Feedback submitted. Pending approval.', 'SUCCESS');
      }
      setContent('');
      setRating(5);
      fetchFeedback();
    } catch (err) {
      showAlert('Error', err.response?.data?.error || err.message, 'ERROR');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (fb) => {
    setEditingId(fb._id);
    setContent(fb.content);
    setRating(fb.rating);
  };

  const handleDelete = (id) => {
    showAlert('Confirm Delete', 'Are you sure you want to delete this feedback?', 'DELETE', async () => {
      try {
        await api.delete(`/feedback/${id}`);
        fetchFeedback();
      } catch (err) { 
        showAlert('Error', err.response?.data?.error || err.message, 'ERROR'); 
      }
    });
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/feedback/${id}/approve`);
      fetchFeedback();
    } catch (err) { 
      showAlert('Error', err.message, 'ERROR'); 
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>⭐ Course Feedback</Text>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <Text style={styles.empty}>No feedback yet. Be the first to review!</Text>
      ) : (
        feedbacks.map((fb) => (
          <View key={fb._id} style={[styles.card, fb.status === 'PENDING' && styles.cardPending]}>
            <View style={styles.cardHeader}>
              <Text style={styles.fbAuthor}>{fb.username}</Text>
              <Text style={styles.stars}>{'⭐'.repeat(fb.rating)}</Text>
            </View>
            <Text style={styles.fbContent}>{fb.content}</Text>
            {fb.status === 'PENDING' && <Text style={styles.pendingBadge}>⏳ Pending</Text>}
            {user && ['ADMIN', 'STAFF'].includes(user.role) && fb.status === 'PENDING' && (
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(fb._id)}>
                <Text style={styles.approveBtnText}>✅ Approve</Text>
              </TouchableOpacity>
            )}
            {user && String(fb.userId) === String(user.id || user._id) && (
              <View style={styles.ownerActions}>
                <TouchableOpacity onPress={() => handleEdit(fb)} style={styles.editBtn}>
                  <Text style={styles.actionText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(fb._id)} style={styles.deleteBtnTextBtn}>
                  <Text style={styles.actionTextDel}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      {/* Submit Form */}
      <View style={styles.formHeader}>
        <Text style={styles.sectionTitle}>{editingId ? 'Edit Your Review' : 'Leave a Review'}</Text>
        {editingId && (
          <TouchableOpacity onPress={() => { setEditingId(null); setContent(''); setRating(5); }}>
            <Text style={styles.cancelEdit}>Cancel Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Rating</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((r) => (
          <TouchableOpacity key={r} onPress={() => setRating(r)}>
            <Text style={[styles.star, r <= rating ? styles.starActive : styles.starInactive]}>⭐</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Your Review</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Share your experience (10–1000 chars)"
        placeholderTextColor="#888"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        maxLength={1000}
      />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Feedback</Text>}
      </TouchableOpacity>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
        onCancel={alertConfig.type === 'DELETE' ? () => setAlertConfig({ ...alertConfig, visible: false }) : null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0F0F23', padding: 16 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' },
  heading:    { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16 },
  empty:      { color: '#666', textAlign: 'center', marginBottom: 20 },
  card:       { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A4A' },
  cardPending:{ borderColor: '#FF9800' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fbAuthor:   { color: '#6C63FF', fontWeight: '700' },
  stars:      { fontSize: 14 },
  fbContent:  { color: '#ccc', lineHeight: 20 },
  pendingBadge:{ color: '#FF9800', fontSize: 12, marginTop: 6 },
  approveBtn: { backgroundColor: '#1A3A1A', borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 8 },
  approveBtnText: { color: '#4CAF50', fontWeight: '700' },
  sectionTitle:{ fontSize: 17, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 12 },
  label:      { color: '#ccc', marginBottom: 6, fontSize: 14 },
  ratingRow:  { flexDirection: 'row', gap: 8, marginBottom: 14 },
  star:       { fontSize: 28 },
  starActive: { opacity: 1 },
  starInactive:{ opacity: 0.3 },
  input: {
    backgroundColor: '#1A1A2E', color: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A4A', fontSize: 14,
  },
  textarea: { height: 110, textAlignVertical: 'top' },
  btn:      { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
  ownerActions: { flexDirection: 'row', gap: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: '#2A2A4A', paddingTop: 10 },
  editBtn:  { padding: 6 },
  deleteBtnTextBtn: { padding: 6 },
  actionText: { color: '#4CAF50', fontWeight: 'bold' },
  actionTextDel: { color: '#F44336', fontWeight: 'bold' },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  cancelEdit: { color: '#FF9800', fontWeight: 'bold', fontSize: 14 },
});
