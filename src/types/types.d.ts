export type AuthStackParamList = {
    Login: undefined;
    SignUp: undefined;
    ForgotPassword: undefined;
    ResetPassword: { email?: string; token?: string } | undefined;
  };
  
  export type AppStackParamList = {
    Home: undefined;
  };

  export type RootStackParamList = {
    Auth: undefined;
    App: undefined;
  };
  
  export type AppTabParamList = {
    Home: undefined;
    Resumes: undefined;
    Templates: undefined;
    Profile: undefined;
  };