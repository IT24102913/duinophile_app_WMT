import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../api/axiosConfig';

export default function CreateLessonScreen({ route, navigation }) {
  const { courseId, lessonId, edit } = route.params || {};
  const [form, setForm] = useState({ title: '', content: '', quiz: [] });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!edit);
  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  // Fetch existing lesson data when editing
  useEffect(() => {
    if (edit && lessonId) {
      const fetchLesson = async () => {
        try {
          const res = await api.get(`/lessons/${lessonId}`);
          const lesson = res.data.lesson || res.data;
          setForm({
            title: lesson.title || '',
            content: lesson.content || '',
            quiz: (lesson.quiz || []).map(q => ({
              question: q.question || '',
              options: q.options || ['', '', '', ''],
              correctOptionIndex: q.correctOptionIndex || 0,
              points: q.points || 10,
            })),
          });
          if (lesson.materialName) {
            setPdfFile({ name: lesson.materialName, existing: true });
          }
        } catch (err) {
          Alert.alert('Error', 'Failed to load lesson data.');
        } finally {
          setFetching(false);
        }
      };
      fetchLesson();
    }
  }, [edit, lessonId]);

  if (fetching) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const addQuestion = () => {
    setForm((p) => ({
      ...p,
      quiz: [...p.quiz, { question: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 10 }],
    }));
  };

  const setQuestion = (idx, field, val) => {
    setForm((p) => {
      const quiz = [...p.quiz];
      quiz[idx] = { ...quiz[idx], [field]: val };
      return { ...p, quiz };
    });
  };

  const setOption = (qIdx, oIdx, val) => {
    setForm((p) => {
      const quiz = [...p.quiz];
      const opts = [...quiz[qIdx].options];
      opts[oIdx] = val;
      quiz[qIdx] = { ...quiz[qIdx], options: opts };
      return { ...p, quiz };
    });
  };

  const removeQuestion = (idx) => {
    setForm((p) => ({ ...p, quiz: p.quiz.filter((_, i) => i !== idx) }));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPdfFile(result.assets[0]);
      } else if (result.type === 'success') {
        // Fallback for older expo SDKs
        setPdfFile(result);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Validation', 'Title and content are required.'); return;
    }
    setLoading(true);
    try {
      const payload = {
        title:    form.title.trim(),
        content:  form.content.trim(),
        courseId,
        quiz:     JSON.stringify(form.quiz),
      };

      let currentLessonId = lessonId;

      if (edit && currentLessonId) {
        await api.put(`/lessons/${currentLessonId}`, payload);
      } else {
        const res = await api.post('/lessons', payload);
        currentLessonId = res.data._id;
      }

      // Upload PDF if one was selected
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', {
          uri: pdfFile.uri,
          name: pdfFile.name,
          type: pdfFile.mimeType || 'application/pdf',
        });
        await api.post(`/lessons/${currentLessonId}/upload-pdf`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      Alert.alert('Success!', `Lesson ${edit ? 'updated' : 'created'} successfully.`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.heading}>{edit ? '✏️ Edit Lesson' : '📖 Create Lesson'}</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} placeholder="Lesson title" placeholderTextColor="#888" value={form.title} onChangeText={set('title')} />

      <Text style={styles.label}>Content *</Text>
      <TextInput style={[styles.input, styles.bigarea]} placeholder="Lesson content (20–15000 chars)" placeholderTextColor="#888" value={form.content} onChangeText={set('content')} multiline numberOfLines={8} />

      <Text style={styles.sectionTitle}>📎 Lesson Material (Optional)</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
        <Text style={styles.uploadBtnText}>
          {pdfFile ? `📄 ${pdfFile.name}` : '+ Choose PDF File'}
        </Text>
      </TouchableOpacity>
      {pdfFile && (
         <TouchableOpacity onPress={() => setPdfFile(null)}>
           <Text style={styles.removeFileBtn}>Remove File</Text>
         </TouchableOpacity>
      )}

      {/* Quiz Builder */}
      <Text style={styles.sectionTitle}>🎯 Quiz Questions ({form.quiz.length})</Text>
      {form.quiz.map((q, qIdx) => (
        <View key={qIdx} style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNum}>Question {qIdx + 1}</Text>
            <TouchableOpacity onPress={() => removeQuestion(qIdx)}>
              <Text style={styles.removeBtn}>✕ Remove</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Question text" placeholderTextColor="#888" value={q.question} onChangeText={(v) => setQuestion(qIdx, 'question', v)} />

          {q.options.map((opt, oIdx) => (
            <View key={oIdx} style={styles.optionRow}>
              <TouchableOpacity onPress={() => setQuestion(qIdx, 'correctOptionIndex', oIdx)}>
                <Text style={{ marginRight: 8, fontSize: 18 }}>{q.correctOptionIndex === oIdx ? '🟢' : '⚪'}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.optionInput]}
                placeholder={`Option ${oIdx + 1}`}
                placeholderTextColor="#888"
                value={opt}
                onChangeText={(v) => setOption(qIdx, oIdx, v)}
              />
            </View>
          ))}

          <View style={styles.pointsRow}>
            <Text style={styles.label}>Points:</Text>
            <TextInput
              style={[styles.input, styles.pointsInput]}
              keyboardType="numeric"
              value={String(q.points)}
              onChangeText={(v) => setQuestion(qIdx, 'points', parseInt(v) || 10)}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
        <Text style={styles.addQuestionText}>+ Add Quiz Question</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{edit ? 'Save Changes' : 'Create Lesson'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0F0F23', padding: 16 },
  heading:      { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 20 },
  label:        { color: '#ccc', marginBottom: 6, fontSize: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginVertical: 12 },
  input: {
    backgroundColor: '#1A1A2E', color: '#fff', borderRadius: 10,
    padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A4A', fontSize: 14, flex: 1,
  },
  bigarea:      { height: 160, textAlignVertical: 'top' },
  uploadBtn:    { backgroundColor: '#2A2A4A', padding: 16, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  uploadBtnText:{ color: '#fff', fontWeight: '600' },
  removeFileBtn:{ color: '#FF6B6B', fontSize: 13, alignSelf: 'center', marginBottom: 16 },
  questionCard: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#2A2A4A' },
  questionHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  questionNum:  { color: '#fff', fontWeight: '700' },
  removeBtn:    { color: '#FF6B6B', fontSize: 13 },
  optionRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  optionInput:  { flex: 1, marginBottom: 0 },
  pointsRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  pointsInput:  { width: 70, flex: 0, textAlign: 'center' },
  addQuestionBtn:{ backgroundColor: '#1A1A2E', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#6C63FF' },
  addQuestionText:{ color: '#6C63FF', fontWeight: '700' },
  btn:    { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
});
