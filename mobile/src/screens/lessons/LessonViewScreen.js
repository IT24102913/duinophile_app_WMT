import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Linking
} from 'react-native';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';

export default function LessonViewScreen({ route, navigation }) {
  const { lessonId } = route.params;
  const { user, updateUser } = useAuth();
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [quizAnswers,  setQuizAnswers]  = useState({});
  const [quizSubmitted,setQuizSubmitted]= useState(false);
  const [quizResult,   setQuizResult]   = useState(null);
  const [completing,   setCompleting]   = useState(false);

  useEffect(() => { fetchLesson(); }, []);

  const fetchLesson = async () => {
    try {
      const res = await api.get(`/lessons/${lessonId}`);
      setData(res.data);
      setQuizSubmitted(res.data.completedQuizLessonIds?.includes(lessonId));
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    setCompleting(true);
    try {
      await api.post(`/lessons/${lessonId}/complete`);
      Alert.alert('✅ Done!', 'Lesson marked as complete.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleSubmitQuiz = async () => {
    const { lesson } = data;
    if (!lesson.quiz?.length) return;

    let correct = 0;
    let earned  = 0;
    const results = lesson.quiz.map((q, idx) => {
      const selected = quizAnswers[idx];
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) { correct++; earned += q.points; }
      return { isCorrect, selectedIndex: selected, correctIndex: q.correctOptionIndex };
    });

    setQuizResult({ results, correct, total: lesson.quiz.length, earned });
    setQuizSubmitted(true);

    try {
      const res = await api.post(`/lessons/${lessonId}/submit-quiz`, { earnedPoints: earned });
      if (updateUser && res.data) {
        updateUser({ ...user, points: res.data.totalPoints });
      }
    } catch (err) {
      if (!err.message.includes('already submitted')) Alert.alert('Error', err.message);
    }
  };

  const handleOpenPdf = () => {
    if (!data?.lesson?.materialUrl) return;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    const url = `${baseUrl}${data.lesson.materialUrl}`;
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Unable to open PDF link. Please try again.');
    });
  };

  const handleDeleteLesson = () => {
    Alert.alert(
      'Delete Lesson',
      'Are you sure you want to delete this lesson? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/lessons/${lessonId}`);
              Alert.alert('Success', 'Lesson deleted.');
              navigation.goBack();
            } catch (err) {
              setLoading(false);
              Alert.alert('Error', err.response?.data?.error || err.message);
            }
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  if (!data)   return null;

  const { lesson, isEnrolled, completedLessonIds } = data;
  const isCompleted = completedLessonIds?.includes(lessonId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Enhanced Header */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>{lesson.title}</Text>
        <View style={styles.headerDetails}>
           <Text style={styles.statusBadge}>{isCompleted ? '✅ Completed' : '📖 In Progress'}</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Lesson Overview</Text>
      <View style={styles.contentCard}>
        <Text style={styles.content}>{lesson.content}</Text>
      </View>

      {/* Admin/Staff Controls */}
      {user && ['ADMIN', 'STAFF'].includes(user.role) && (
        <View style={styles.adminControls}>
          <TouchableOpacity 
            style={styles.adminEditBtn} 
            onPress={() => navigation.navigate('CreateLesson', { courseId: lesson.courseId, lessonId: lesson._id, edit: true })}
          >
            <Text style={styles.adminBtnText}>✏️ Edit Lesson</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.adminDeleteBtn} 
            onPress={handleDeleteLesson}
          >
            <Text style={styles.adminBtnText}>Delete Lesson</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PDF Material Section */}
      {lesson.materialUrl && (
        <View style={styles.materialCard}>
          <View style={styles.materialHeader}>
            <Text style={styles.materialIcon}>📄</Text>
            <View style={{ flex: 1 }}>
               <Text style={styles.materialTitle}>Attached Document</Text>
               <Text style={styles.materialName} numberOfLines={1}>{lesson.materialName || 'Lesson Material.pdf'}</Text>
            </View>
          </View>
          <View style={styles.materialActions}>
             <TouchableOpacity style={[styles.pdfBtn, styles.pdfViewBtn]} onPress={handleOpenPdf}>
               <Text style={styles.pdfBtnText}>👁️ View PDF</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.pdfBtn, styles.pdfDownloadBtn]} onPress={handleOpenPdf}>
               <Text style={styles.pdfBtnText}>⬇️ Download</Text>
             </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Enhanced Quiz Section */}
      {lesson.quiz?.length > 0 && (
        <View style={styles.quizWrapper}>
          <View style={styles.quizHeaderRow}>
             <Text style={styles.quizHeading}>🎯 Knowledge Check</Text>
             <Text style={styles.quizSubheading}>{lesson.quiz.length} Questions</Text>
          </View>

          {quizSubmitted && quizResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultEmoji}>🏆</Text>
              <Text style={styles.resultText}>
                You scored {quizResult.correct} out of {quizResult.total}
              </Text>
              <Text style={styles.resultPoints}>Earned {quizResult.earned} points!</Text>
            </View>
          )}
          {quizSubmitted && !quizResult && (
            <View style={styles.alreadyDoneBox}>
              <Text style={styles.alreadyDone}>✅ You have already completed this quiz.</Text>
              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: '#FF6B6B', marginTop: 14, marginBottom: 0 }]} 
                onPress={() => {
                  setQuizSubmitted(false);
                  setQuizResult(null);
                  setQuizAnswers({});
                }}
              >
                <Text style={styles.submitBtnText}>Reattempt Quiz</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: '#4CAF50', marginTop: 12, marginBottom: 0 }]} 
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.submitBtnText}>Back to Course</Text>
              </TouchableOpacity>
            </View>
          )}

          {lesson.quiz.map((q, qIdx) => (
            <View key={qIdx} style={styles.questionCard}>
              <View style={styles.questionMetaRow}>
                <Text style={styles.questionNumberBadge}>Q{qIdx + 1}</Text>
                <Text style={styles.pointsNote}>{q.points} pts</Text>
              </View>
              {q.content ? <Text style={styles.questionContent}>{q.content}</Text> : null}
              <Text style={styles.questionText}>{q.question}</Text>
              
              <View style={styles.optionsWrapper}>
                {q.options.map((opt, oIdx) => {
                  const isSelected = quizAnswers[qIdx] === oIdx;
                  const isCorrect  = quizResult?.results[qIdx]?.correctIndex === oIdx;
                  const isWrong    = quizSubmitted && isSelected && !isCorrect;
                  return (
                    <TouchableOpacity
                      key={oIdx}
                      style={[
                        styles.option,
                        isSelected && styles.optionSelected,
                        quizSubmitted && isCorrect && styles.optionCorrect,
                        quizSubmitted && isWrong   && styles.optionWrong,
                      ]}
                      onPress={() => !quizSubmitted && setQuizAnswers((p) => ({ ...p, [qIdx]: oIdx }))}
                      disabled={quizSubmitted}
                    >
                      <Text style={[styles.optionText, (isSelected || (quizSubmitted && isCorrect)) && styles.optionTextBold]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {!quizSubmitted && (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitQuiz}>
              <Text style={styles.submitBtnText}>Submit Quiz</Text>
            </TouchableOpacity>
          )}

          {quizSubmitted && (
            <View style={{ marginTop: 20 }}>
              {quizResult && quizResult.correct < quizResult.total && (
                <TouchableOpacity 
                  style={[styles.submitBtn, { backgroundColor: '#FF6B6B', marginTop: 0, marginBottom: 16 }]} 
                  onPress={() => {
                    setQuizSubmitted(false);
                    setQuizResult(null);
                    setQuizAnswers({});
                  }}
                >
                  <Text style={styles.submitBtnText}>Retry Quiz</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: '#4CAF50', marginTop: 0, marginBottom: 10 }]} 
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.submitBtnText}>Back to Course</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Complete Button */}
      {isEnrolled && !isCompleted && !lesson.quiz?.length && (
        <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteLesson} disabled={completing}>
          {completing ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeBtnText}>✅ Mark as Complete</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0F0F23' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' },
  headerCard:      { backgroundColor: '#6C63FF', padding: 20, paddingTop: 40, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 20 },
  title:           { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 12 },
  headerDetails:   { flexDirection: 'row', alignItems: 'center' },
  statusBadge:     { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, color: '#fff', fontWeight: 'bold', fontSize: 13 },
  adminControls:   { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  adminEditBtn:    { flex: 1, backgroundColor: '#2A2A4A', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  adminDeleteBtn:  { flex: 1, backgroundColor: '#e53935', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  adminBtnText:    { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  sectionHeader:   { paddingHorizontal: 20, fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  contentCard:     { backgroundColor: '#1A1A2E', marginHorizontal: 16, padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2A2A4A' },
  content:         { color: '#E0E0E0', lineHeight: 26, fontSize: 16 },
  
  materialCard:    { backgroundColor: '#1A1A2E', marginHorizontal: 16, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2A2A4A' },
  materialHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  materialIcon:    { fontSize: 32, marginRight: 12 },
  materialTitle:   { color: '#aaa', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
  materialName:    { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  materialActions: { flexDirection: 'row', gap: 10 },
  pdfBtn:          { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  pdfViewBtn:      { backgroundColor: 'rgba(108, 99, 255, 0.15)', borderWidth: 1, borderColor: '#6C63FF' },
  pdfDownloadBtn:  { backgroundColor: '#6C63FF' },
  pdfBtnText:      { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  quizWrapper:     { marginTop: 10, paddingHorizontal: 16 },
  quizHeaderRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  quizHeading:     { fontSize: 20, fontWeight: '800', color: '#fff' },
  quizSubheading:  { color: '#888', fontWeight: '600' },
  
  resultBox:       { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: '#4CAF50', borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' },
  resultEmoji:     { fontSize: 40, marginBottom: 8 },
  resultText:      { color: '#4CAF50', fontWeight: '800', fontSize: 18, marginBottom: 4 },
  resultPoints:    { color: '#FFF', fontWeight: '600', fontSize: 14 },
  
  alreadyDoneBox:  { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center' },
  alreadyDone:     { color: '#aaa', fontWeight: '600', fontSize: 15 },
  
  questionCard:    { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A4A' },
  questionMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  questionNumberBadge: { backgroundColor: '#6C63FF', color: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontWeight: 'bold', fontSize: 12 },
  questionContent: { color: '#aaa', fontSize: 14, marginBottom: 10, fontStyle: 'italic', lineHeight: 22 },
  questionText:    { color: '#fff', fontWeight: '700', fontSize: 17, marginBottom: 16, lineHeight: 24 },
  pointsNote:      { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  optionsWrapper:  { marginTop: 4 },
  option:          { backgroundColor: '#0F0F23', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2A2A4A' },
  optionSelected:  { borderColor: '#6C63FF', backgroundColor: 'rgba(108, 99, 255, 0.1)' },
  optionCorrect:   { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  optionWrong:     { borderColor: '#F44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' },
  optionText:      { color: '#ccc', fontSize: 15, lineHeight: 22 },
  optionTextBold:  { color: '#fff', fontWeight: 'bold' },
  
  submitBtn:       { backgroundColor: '#6C63FF', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, marginBottom: 20, shadowColor: '#6C63FF', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  submitBtnText:   { color: '#fff', fontWeight: '800', fontSize: 18, textTransform: 'uppercase' },
  
  completeBtn:     { backgroundColor: '#4CAF50', padding: 18, borderRadius: 14, alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 30, shadowColor: '#4CAF50', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  completeBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
