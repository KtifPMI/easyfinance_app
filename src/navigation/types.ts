import { OperationType } from '../types';

export type AuthStackParamList = {
  Login: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  GoalDetail: { goalId: string };
};

export type OperationsStackParamList = {
  OperationsList: undefined;
  OperationDetail: { operationId: string };
  Trash: undefined;
};

export type PlanStackParamList = {
  PlanMain: undefined;
  GoalDetail: { goalId: string };
  AddGoal: undefined;
};

export type CalendarStackParamList = {
  CalendarMain: undefined;
};

export type ReportsStackParamList = {
  ReportsMain: undefined;
};

export type MoreStackParamList = {
  MoreMain: undefined;
  Bank: undefined;
  Recommendations: undefined;
  Informer: undefined;
  Settings: undefined;
  AiAssistant: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  OperationsTab: undefined;
  PlanTab: undefined;
  CalendarTab: undefined;
  ReportsTab: undefined;
  MoreTab: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  AddOperation: { type?: OperationType; operationId?: string } | undefined;
};
