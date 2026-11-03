import type { NavigatorScreenParams } from "@react-navigation/native";
import type { StartMode, ResumeData } from "./resume";
import type { AtsResult } from "../services/atsService";

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string; token?: string } | undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Resumes: undefined;
  Templates: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
  ResumeStart: { templateId: string };
  ResumeImport: undefined;
  ResumeImprove: {
    data: ResumeData;
    result: AtsResult;
    stack: string;
    source: "ai" | "rules";
    fileName?: string;
  };
  ResumePickTemplate: { data: ResumeData; title: string };
  ResumeEditor: {
    templateId?: string;
    resumeId?: string;
    mode?: StartMode;
    title?: string;
    initialData?: ResumeData;
    aiDraft?: boolean;
  };
  ResumeAts: undefined;
  ResumePreview: { resumeId: string; title?: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
