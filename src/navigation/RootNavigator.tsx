import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { LoadingState } from '../components/common';
import { AddOperationScreen } from '../screens/Operations/AddOperationScreen';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isInitializing, init } = useAuthStore();

  useEffect(() => {
    init();
  }, []);

  if (isInitializing) {
    return <LoadingState label="Загрузка приложения..." />;
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="AddOperation"
            component={AddOperationScreen}
            options={{ presentation: 'modal', headerShown: true, title: 'Новая операция' }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
