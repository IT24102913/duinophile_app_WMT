import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/common/CustomAlert';

export default function CourseDetailScreen({ route, navigation }) {
  const { courseId } = route.params;
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const fetchDetails = useCallback(async () => {
    try {
      const res = await api.get(`/courses/${courseId}/details`);
      setData(res.data);
    } catch (err) {
      showAlert('Error', err.message, 'ERROR');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [fetchDetails])
  );

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      fetchDetails();
      showAlert('Success', 'You have enrolled in this course!', 'SUCCESS');
    } catch (err) {
      showAlert('Enrollment Failed', err.message, 'ERROR');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDeleteCourse = () => {
    showAlert(
      'Delete Course',
      'Are you sure you want to delete this course? This action is irreversible.',
      'DELETE',
      async () => {
        try {
          setLoading(true);
          await api.delete(`/courses/${courseId}`);
          showAlert('Success', 'Course deleted.', 'SUCCESS', () => navigation.goBack());
        } catch (err) {
          setLoading(false);
          showAlert('Error', err.response?.data?.error || err.message, 'ERROR');
        }
      }
    );
  };

  if (!data && loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  if (!data) return null;

  const { course, lessons, isEnrolled, completedLessonIds, progress } = data;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Course Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.level}>{course.level}</Text>
            <Text style={styles.description}>{course.description}</Text>
          </View>

          {/* Progress Bar */}
          {isEnrolled && (
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Your Progress: {progress}%</Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          )}

          {/* Points required */}
          {course.minimumPointsRequired > 0 && (
            <Text style={styles.pointsNote}>🏆 Requires {course.minimumPointsRequired} points to enroll</Text>
          )}

          {/* Enroll Button */}
          {!isEnrolled && user && !['ADMIN', 'STAFF'].includes(user.role) && (
            <TouchableOpacity style={styles.enrollBtn} onPress={handleEnroll} disabled={enrolling}>
              {enrolling ? <ActivityIndicator color="#fff" /> : <Text style={styles.enrollText}>Enroll Now</Text>}
            </TouchableOpacity>
          )}

          {/* Staff/Admin controls */}
          {user && ['ADMIN', 'STAFF'].includes(user.role) && (
            <View style={styles.adminRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('CreateCourse', { courseId, edit: true })}>
                <Text style={styles.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addLessonBtn} onPress={() => navigation.navigate('CreateLesson', { courseId })}>
                <Text style={styles.addBtnText}>+ Add Lesson</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteCourse}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lessons */}
          <Text style={styles.sectionTitle}>Lessons ({lessons.length})</Text>
          {lessons.length === 0 ? (
            <Text style={styles.empty}>No lessons yet.</Text>
          ) : (
            lessons.map((lesson, idx) => {
              const isCompleted = completedLessonIds.includes(String(lesson._id));
              return (
                <TouchableOpacity
                  key={lesson._id}
                  style={[styles.lessonCard, isCompleted && styles.lessonCompleted]}
                  onPress={() => isEnrolled || ['ADMIN', 'STAFF'].includes(user?.role)
                    ? navigation.navigate('LessonView', { lessonId: lesson._id })
                    : showAlert('Enroll First', 'You must be enrolled to access lessons.', 'INFO')}
                >
                  <Text style={styles.lessonNum}>{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  </View>
                  <Text style={isCompleted ? styles.checkDone : styles.checkTodo}>
                    {isCompleted ? '✅' : '○'}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}

          {/* Feedback Button */}
          <TouchableOpacity style={styles.feedbackBtn} onPress={() => navigation.navigate('Feedback', { courseId })}>
            <Text style={styles.feedbackBtnText}>⭐ View / Submit Feedback</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

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
          (alertConfig.title.includes('Are you sure') || alertConfig.title.includes('Course'))
          ? () => setAlertConfig({ ...alertConfig, visible: false }) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0F0F23', padding: 16 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' },
  header:         { backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 16 },
  title:          { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  level:          { fontSize: 12, color: '#6C63FF', fontWeight: '700', marginBottom: 8 },
  description:    { color: '#aaa', lineHeight: 20 },
  progressSection:{ marginBottom: 16 },
  progressLabel:  { color: '#ccc', marginBottom: 6 },
  progressBg:     { height: 8, backgroundColor: '#2A2A4A', borderRadius: 4 },
  progressFill:   { height: 8, backgroundColor: '#6C63FF', borderRadius: 4 },
  pointsNote:     { color: '#FFD700', textAlign: 'center', marginBottom: 12 },
  enrollBtn:      { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  enrollText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  adminRow:       { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  editBtn:        { backgroundColor: '#2A2A4A', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  editBtnText:    { color: '#fff', fontWeight: '600' },
  addLessonBtn:   { backgroundColor: '#6C63FF', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  addBtnText:     { color: '#fff', fontWeight: '700' },
  deleteBtn:      { backgroundColor: '#e53935', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  deleteBtnText:  { color: '#fff', fontWeight: '700' },
  sectionTitle:   { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  empty:          { color: '#666', textAlign: 'center', marginTop: 20 },
  lessonCard: {
    backgroundColor: '#1A1A2E', borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12,
  },
  lessonCompleted:{ borderColor: '#6C63FF', borderWidth: 1 },
  lessonNum:      { color: '#6C63FF', fontWeight: '800', fontSize: 16, width: 24 },
  lessonTitle:    { color: '#fff', fontWeight: '600' },
  checkDone:      { fontSize: 18 },
  checkTodo:      { color: '#444', fontSize: 18 },
  feedbackBtn:    { backgroundColor: '#1A1A2E', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#6C63FF' },
  feedbackBtnText:{ color: '#6C63FF', fontWeight: '700' },
});
