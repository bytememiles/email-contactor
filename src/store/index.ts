import { configureStore } from '@reduxjs/toolkit';

import smtpReducer from './slices/smtpSlice';

export const store = configureStore({
  reducer: {
    smtp: smtpReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
