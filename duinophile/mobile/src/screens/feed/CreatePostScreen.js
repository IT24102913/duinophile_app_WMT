import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/common/CustomAlert';

const ACHIEVEMENT_TYPES = ['Course Completion', 'Quiz Score', 'Milestone', 'General'];

export default function CreatePostScreen({ route, navigation }) {
  const { user } = useAuth();
  const editingPost = route.params?.post;
  const isEditing = !!editingPost;

  const [content, setContent]             = useState(editingPost?.content || '');
  const [achievementType, setAchievement] = useState(editingPost?.achievementType || 'General');
  const [image, setImage]                 = useState(null);
  const [loading, setLoading]             = useState(false);
  const [alertConfig, setAlertConfig]     = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Please allow access to your photo library.', 'ERROR');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (content.trim().length < 10) {
      showAlert('Validation', 'Post must be at least 10 characters.', 'ERROR'); return;
    }
    setLoading(true);
    try {
      let postId;

      if (isEditing) {
        await api.put(`/posts/${editingPost._id}`, { content: content.trim(), achievementType });
        postId = editingPost._id;
      } else {
        const res = await api.post('/posts', { content: content.trim(), achievementType });
        postId = res.data._id;
      }

      // Upload image if selected
      if (image && postId) {
        const formData = new FormData();
        const ext = image.uri.split('.').pop();
        formData.append('image', {
          uri: image.uri,
          name: `post_image.${ext}`,
          type: image.mimeType || `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        });
        await api.post(`/posts/${postId}/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showAlert(
        isEditing ? 'Updated!' : 'Posted!', 
        isEditing ? 'Your post has been updated and is pending approval.' : 'Your post has been submitted for approval.',
        'SUCCESS',
        () => navigation.navigate('FeedHome')
      );
    } catch (err) {
      showAlert('Error', err.message, 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>{isEditing ? '✏️ Edit Post' : '📝 New Post'}</Text>

      <Text style={styles.label}>Achievement Type</Text>
      <View style={styles.typeRow}>
        {ACHIEVEMENT_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, achievementType === t && styles.typeBtnActive]}
            onPress={() => setAchievement(t)}
          >
            <Text style={[styles.typeBtnText, achievementType === t && styles.typeBtnTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>What's your achievement?</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Share your achievement, milestone, or update... (10–3000 chars)"
        placeholderTextColor="#818181"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={6}
        maxLength={3000}
      />
      <Text style={styles.charCount}>{content.length}/3000</Text>

      {/* Image Upload Section */}
      <Text style={styles.label}>Attach Image (Optional)</Text>
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>⚠️ Please add only images related to Arduino projects and achievements.</Text>
      </View>
      <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
        <Text style={styles.imagePickerText}>
          {image ? '📷 Change Image' : '📷 Choose Image'}
        </Text>
      </TouchableOpacity>
      {image && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
            <Text style={styles.removeImageText}>✕ Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.btnText}>{isEditing ? 'Update Post' : 'Submit Post'}</Text>}
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
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F23', padding: 20 },
  heading:   { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 20 },
  label:     { color: '#ccc', marginBottom: 8, fontSize: 14 },
  typeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeBtn:   { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#1A1A2E', borderRadius: 20, borderWidth: 1, borderColor: '#2A2A4A' },
  typeBtnActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  typeBtnText:   { color: '#aaa', fontSize: 12 },
  typeBtnTextActive: { color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: '#1A1A2E', color: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 4, borderWidth: 1, borderColor: '#2A2A4A', fontSize: 15,
  },
  textarea:  { height: 160, textAlignVertical: 'top' },
  charCount: { color: '#666', fontSize: 12, textAlign: 'right', marginBottom: 16 },
  warningBox: { backgroundColor: 'rgba(255, 152, 0, 0.1)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 10, padding: 12, marginBottom: 12 },
  warningText: { color: '#FF9800', fontSize: 13, lineHeight: 20 },
  imagePickerBtn: { backgroundColor: '#2A2A4A', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  imagePickerText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  imagePreviewContainer: { alignItems: 'center', marginBottom: 16 },
  imagePreview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
  removeImageBtn: { alignSelf: 'center' },
  removeImageText: { color: '#FF6B6B', fontSize: 13, fontWeight: '600' },
  btn:    { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
});
