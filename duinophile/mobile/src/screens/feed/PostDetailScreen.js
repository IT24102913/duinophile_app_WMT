import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';
import CommentSection from './CommentSection';

export default function PostDetailScreen({ route }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    fetchPost();
  }, []);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/posts/${postId}`);
      setPost(res.data);
    } catch (err) {
      showAlert('Error', err.message, 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#5e56fc" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Post */}
      {post && (
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <Text style={styles.author}>{post.authorName}</Text>
            <Text style={styles.badge}>{post.achievementType}</Text>
          </View>
          <Text style={styles.postContent}>{post.content}</Text>
          {post.imageUrl && (
            <Image 
              source={{ uri: `${api.defaults.baseURL.replace('/api', '')}${post.imageUrl}` }} 
              style={styles.postImage} 
              resizeMode="cover"
            />
          )}
        </View>
      )}

      {/* Extracted Comments Component */}
      <CommentSection postId={postId} />
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0F0F23', padding: 16 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' },
  postCard:      { backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 16 },
  postHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  author:        { color: '#6d66fd', fontWeight: '700' },
  badge:         { fontSize: 11, color: '#ffffff', backgroundColor: '#2A2A4A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  postContent:   { color: '#ddd', lineHeight: 20 },
  postImage:     { width: '100%', height: 220, borderRadius: 10, marginTop: 12 },
});
