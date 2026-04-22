import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Text } from 'react-native';

// Screens
import CourseListScreen   from '../screens/courses/CourseListScreen';
import CourseDetailScreen from '../screens/courses/CourseDetailScreen';
import CreateCourseScreen from '../screens/courses/CreateCourseScreen';
import LessonViewScreen   from '../screens/lessons/LessonViewScreen';
import CreateLessonScreen from '../screens/lessons/CreateLessonScreen';
import FeedScreen         from '../screens/feed/FeedScreen';
import CreatePostScreen   from '../screens/feed/CreatePostScreen';
import PostDetailScreen   from '../screens/feed/PostDetailScreen';
import ProfileScreen      from '../screens/profile/ProfileScreen';
import FeedbackScreen     from '../screens/feedback/FeedbackScreen';
import FeedbackManagementScreen from '../screens/feedback/FeedbackManagementScreen';
import MyReportsScreen    from '../screens/reports/MyReportsScreen';
import AdminDashboardScreen   from '../screens/admin/AdminDashboardScreen';
import UserFormScreen         from '../screens/admin/UserFormScreen';
import ReportManagementScreen from '../screens/reports/ReportManagementScreen';
import { useAuth }            from '../context/AuthContext';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Courses Stack ─────────────────────────────────────────────────────────────
function CoursesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CourseList"   component={CourseListScreen}   options={{ title: 'Courses' }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Course Details' }} />
      <Stack.Screen name="CreateCourse" component={CreateCourseScreen} options={{ title: 'Create Course' }} />
      <Stack.Screen name="LessonView"   component={LessonViewScreen}   options={{ title: 'Lesson' }} />
      <Stack.Screen name="CreateLesson" component={CreateLessonScreen} options={{ title: 'Add Lesson' }} />
      <Stack.Screen name="Feedback"     component={FeedbackScreen}     options={{ title: 'Feedback' }} />
    </Stack.Navigator>
  );
}

// ── Feed Stack ────────────────────────────────────────────────────────────────
function FeedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FeedHome"   component={FeedScreen}       options={{ title: 'Community Feed' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'New Post' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
    </Stack.Navigator>
  );
}

// ── Reports Stack (Student: My Reports) ───────────────────────────────────────
function ReportsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyReports" component={MyReportsScreen} options={{ title: 'My Reports' }} />
    </Stack.Navigator>
  );
}

// ── Admin Stack ───────────────────────────────────────────────────────────────
function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminDashboard"   component={AdminDashboardScreen}   options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="UserForm"         component={UserFormScreen}         options={{ title: 'Manage User' }} />
    </Stack.Navigator>
  );
}

// ── Report Manager Stack (Admin/Staff) ───────────────────────────────────────
function ReportManagerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ReportManagement" component={ReportManagementScreen} options={{ title: 'Report Management' }} />
    </Stack.Navigator>
  );
}

// ── Feedback Manager Stack (Admin/Staff) ─────────────────────────────────────
function FeedbackManagerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FeedbackManagement" component={FeedbackManagementScreen} options={{ title: 'Feedback Management' }} />
    </Stack.Navigator>
  );
}

// ── Bottom Tabs ───────────────────────────────────────────────────────────────
export default function MainTabs() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#6C63FF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: { 
          backgroundColor: '#0F0F23', 
          borderTopColor: '#2A2A4A',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarIcon: ({ focused }) => {
          let emoji = '❓';
          switch (route.name) {
            case 'Courses':             emoji = '📚'; break;
            case 'Feed':                emoji = '📢'; break;
            case 'Reports':             emoji = '⚠️'; break;
            case 'Manage Reports':      emoji = '🛡️'; break;
            case 'Feedback Management': emoji = '⭐'; break;
            case 'Admin':               emoji = '⚙️'; break;
            case 'Profile':             emoji = '👤'; break;
          }
          return (
            <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5, marginBottom: -2 }}>
              {emoji}
            </Text>
          );
        },
        tabBarLabel: ({ focused, color }) => {
          // Shorten extremely long names
          let labelName = route.name;
          if (labelName === 'Feedback Management') labelName = 'Feedback';
          if (labelName === 'Manage Reports') labelName = 'Reports (A)';

          return (
            <Text style={{ color, fontSize: 10, fontWeight: focused ? '800' : '600' }}>
              {labelName}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Courses" component={CoursesStack} />
      <Tab.Screen name="Feed"    component={FeedStack} />
      {user && !['ADMIN', 'STAFF'].includes(user.role) && (
        <Tab.Screen name="Reports" component={ReportsStack} />
      )}
      {user && ['ADMIN', 'STAFF'].includes(user.role) && (
        <>
          <Tab.Screen name="Manage Reports" component={ReportManagerStack} />
          <Tab.Screen name="Feedback Management" component={FeedbackManagerStack} />
        </>
      )}
      {user && user.role === 'ADMIN' && (
        <Tab.Screen name="Admin" component={AdminStack} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
