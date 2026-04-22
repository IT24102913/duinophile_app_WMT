import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';

const LEVEL_COLORS = { BEGINNER: '#4CAF50', INTERMEDIATE: '#FF9800', ADVANCED: '#F44336' };

export default function CourseListScreen({ navigation }) {
  const { user } = useAuth();
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,  setSearch]    = useState('');
  const [error,   setError]     = useState('');

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [fetchCourses])
  );

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const renderCourse = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item._id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[item.level] || '#6C63FF' }]}>
          {item.level}
        </Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.pointsText}>🏆 {item.minimumPointsRequired} pts required</Text>
        <Text style={styles.arrowText}>View →</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>📚 All Courses</Text>
        {user && ['ADMIN', 'STAFF'].includes(user.role) && (
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateCourse')}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search courses..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderCourse}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCourses(); }} tintColor="#6C63FF" />}
        ListEmptyComponent={<Text style={styles.empty}>No courses found.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0F0F23', padding: 16 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' },
  heading:     { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn:      { backgroundColor: '#6C63FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText:  { color: '#fff', fontWeight: '700' },
  searchInput: {
    backgroundColor: '#1A1A2E', color: '#fff', borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A4A',
  },
  card: {
    backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#2A2A4A',
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  courseTitle:  { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1, marginRight: 8 },
  levelBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 11, color: '#fff', fontWeight: '700' },
  description:  { color: '#aaa', fontSize: 13, marginBottom: 12 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between' },
  pointsText:   { color: '#FFD700', fontSize: 13 },
  arrowText:    { color: '#6C63FF', fontWeight: '700' },
  empty:        { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
  errorText:    { color: '#FF6B6B', textAlign: 'center', marginBottom: 10 },
});
