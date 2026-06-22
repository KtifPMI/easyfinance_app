import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../theme';

import { CalendarScreen } from '../screens/Calendar/CalendarScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { OperationDetailScreen } from '../screens/Operations/OperationDetailScreen';
import { OperationsListScreen } from '../screens/Operations/OperationsListScreen';
import { TrashScreen } from '../screens/Operations/TrashScreen';
import { GoalDetailScreen } from '../screens/Goals/GoalDetailScreen';
import { AddGoalScreen } from '../screens/Goals/AddGoalScreen';
import { PlanScreen } from '../screens/Budget/PlanScreen';
import { ReportsScreen } from '../screens/Reports/ReportsScreen';
import { BankScreen } from '../screens/Bank/BankScreen';
import { InformerScreen } from '../screens/Informer/InformerScreen';
import { MoreScreen } from '../screens/More/MoreScreen';
import { RecommendationsScreen } from '../screens/Advice/RecommendationsScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { AiAssistantScreen } from '../screens/More/AiAssistantScreen';

import {
  CalendarStackParamList,
  HomeStackParamList,
  MainTabParamList,
  MoreStackParamList,
  OperationsStackParamList,
  PlanStackParamList,
  ReportsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const OperationsStack = createNativeStackNavigator<OperationsStackParamList>();
const PlanStack = createNativeStackNavigator<PlanStackParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const ReportsStack = createNativeStackNavigator<ReportsStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'EasyFinance' }} />
      <HomeStack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: 'Цель' }} />
    </HomeStack.Navigator>
  );
}

function OperationsStackNavigator() {
  return (
    <OperationsStack.Navigator>
      <OperationsStack.Screen name="OperationsList" component={OperationsListScreen} options={{ title: 'Операции' }} />
      <OperationsStack.Screen name="OperationDetail" component={OperationDetailScreen} options={{ title: 'Операция' }} />
      <OperationsStack.Screen name="Trash" component={TrashScreen} options={{ title: 'Корзина' }} />
    </OperationsStack.Navigator>
  );
}

function PlanStackNavigator() {
  return (
    <PlanStack.Navigator>
      <PlanStack.Screen name="PlanMain" component={PlanScreen} options={{ title: 'Бюджет и цели' }} />
      <PlanStack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: 'Цель' }} />
      <PlanStack.Screen name="AddGoal" component={AddGoalScreen} options={{ title: 'Новая цель', presentation: 'modal' }} />
    </PlanStack.Navigator>
  );
}

function CalendarStackNavigator() {
  return (
    <CalendarStack.Navigator>
      <CalendarStack.Screen name="CalendarMain" component={CalendarScreen} options={{ title: 'Календарь' }} />
    </CalendarStack.Navigator>
  );
}

function ReportsStackNavigator() {
  return (
    <ReportsStack.Navigator>
      <ReportsStack.Screen name="ReportsMain" component={ReportsScreen} options={{ title: 'Отчёты' }} />
    </ReportsStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator>
      <MoreStack.Screen name="MoreMain" component={MoreScreen} options={{ title: 'Ещё' }} />
      <MoreStack.Screen name="Bank" component={BankScreen} options={{ title: 'EasyBank' }} />
      <MoreStack.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'Рекомендации' }} />
      <MoreStack.Screen name="Informer" component={InformerScreen} options={{ title: 'Информер' }} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
      <MoreStack.Screen name="AiAssistant" component={AiAssistantScreen} options={{ title: 'ИИ-ассистент' }} />
    </MoreStack.Navigator>
  );
}

const icons: Record<keyof MainTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
  HomeTab: 'home-variant',
  OperationsTab: 'format-list-bulleted',
  PlanTab: 'target',
  CalendarTab: 'calendar-month',
  ReportsTab: 'chart-pie',
  MoreTab: 'menu',
};

const labels: Record<keyof MainTabParamList, string> = {
  HomeTab: 'Главная',
  OperationsTab: 'Учёт',
  PlanTab: 'План',
  CalendarTab: 'Календарь',
  ReportsTab: 'Отчёты',
  MoreTab: 'Ещё',
};

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabel: labels[route.name as keyof MainTabParamList],
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={icons[route.name as keyof MainTabParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="OperationsTab" component={OperationsStackNavigator} />
      <Tab.Screen name="PlanTab" component={PlanStackNavigator} />
      <Tab.Screen name="CalendarTab" component={CalendarStackNavigator} />
      <Tab.Screen name="ReportsTab" component={ReportsStackNavigator} />
      <Tab.Screen name="MoreTab" component={MoreStackNavigator} />
    </Tab.Navigator>
  );
}
