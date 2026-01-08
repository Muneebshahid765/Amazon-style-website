import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const checkEmailAvailability = createAsyncThunk(
  'registration/checkEmail',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/auth/check-email`, {
        params: { email },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check email availability');
    }
  }
);

export const checkBusinessNameAvailability = createAsyncThunk(
  'registration/checkBusinessName',
  async (businessName, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/auth/check-business-name`, {
        params: { businessName },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check business name availability');
    }
  }
);

export const submitStep1 = createAsyncThunk(
  'registration/submitStep1',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/step1`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit step 1');
    }
  }
);

export const submitStep2 = createAsyncThunk(
  'registration/submitStep2',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/step2`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit step 2');
    }
  }
);

export const submitStep3 = createAsyncThunk(
  'registration/submitStep3',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/step3`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit step 3');
    }
  }
);

export const submitStep4 = createAsyncThunk(
  'registration/submitStep4',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/step4`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit step 4');
    }
  }
);

export const uploadBusinessLogo = createAsyncThunk(
  'registration/uploadLogo',
  async ({ registrationId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('registrationId', registrationId);
      formData.append('logo', file);

      const response = await axios.post(`${API_URL}/auth/register/upload-logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload logo');
    }
  }
);

export const uploadBusinessDocuments = createAsyncThunk(
  'registration/uploadDocuments',
  async ({ registrationId, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('registrationId', registrationId);
      files.forEach((file) => {
        formData.append('documents', file);
      });

      const response = await axios.post(`${API_URL}/auth/register/upload-documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload documents');
    }
  }
);

export const sendVerificationCode = createAsyncThunk(
  'registration/sendVerificationCode',
  async (registrationId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/send-verification`, {
        registrationId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send verification code');
    }
  }
);

export const verifyCode = createAsyncThunk(
  'registration/verifyCode',
  async ({ registrationId, code }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/verify-code`, {
        registrationId,
        code,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify code');
    }
  }
);

export const resendVerificationCode = createAsyncThunk(
  'registration/resendCode',
  async (registrationId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/resend-code`, {
        registrationId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend verification code');
    }
  }
);

export const completeRegistration = createAsyncThunk(
  'registration/complete',
  async ({ registrationId, agreeToTerms, agreeToPrivacy }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/complete`, {
        registrationId,
        agreeToTerms,
        agreeToPrivacy,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete registration');
    }
  }
);

const initialState = {
  registrationStep: 1,
  registrationData: {
    accountType: null,
    personalInfo: {},
    address: {},
    businessInfo: {},
    logo: null,
    documents: [],
    isUpgrade: false,
    existingUserId: null,
  },
  registrationId: null,
  verificationSent: false,
  isEmailVerified: false,
  maskedEmail: '',
  emailAvailable: null,
  businessNameAvailable: null,
  loading: false,
  uploadingLogo: false,
  uploadingDocuments: false,
  error: null,
  user: null,
  isAuthenticated: false,
};

const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    setRegistrationStep: (state, action) => {
      state.registrationStep = action.payload;
    },
    saveStepData: (state, action) => {
      const { step, data } = action.payload;
      switch (step) {
        case 1:
          state.registrationData.accountType = data.accountType;
          break;
        case 2:
          state.registrationData.personalInfo = data;
          break;
        case 3:
          state.registrationData.address = data;
          break;
        case 4:
          state.registrationData.businessInfo = data;
          break;
        default:
          break;
      }
    },
    setLogo: (state, action) => {
      state.registrationData.logo = action.payload;
    },
    setDocuments: (state, action) => {
      state.registrationData.documents = action.payload;
    },
    clearRegistrationData: (state) => {
      return initialState;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkEmailAvailability.pending, (state) => {
        state.emailAvailable = null;
      })
      .addCase(checkEmailAvailability.fulfilled, (state, action) => {
        state.emailAvailable = action.payload.available;
      })
      .addCase(checkEmailAvailability.rejected, (state) => {
        state.emailAvailable = null;
      })

      .addCase(checkBusinessNameAvailability.pending, (state) => {
        state.businessNameAvailable = null;
      })
      .addCase(checkBusinessNameAvailability.fulfilled, (state, action) => {
        state.businessNameAvailable = action.payload.available;
      })
      .addCase(checkBusinessNameAvailability.rejected, (state) => {
        state.businessNameAvailable = null;
      })

      .addCase(submitStep1.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitStep1.fulfilled, (state, action) => {
        state.loading = false;
        const {
          registrationId,
          accountType,
          isUpgrade,
          existingUserId,
          prefilledPersonalInfo,
          prefilledAddress,
          prefilledBusinessInfo,
        } = action.payload;
        state.registrationId = registrationId;
        state.registrationData.accountType = accountType;
        state.registrationData.isUpgrade = Boolean(isUpgrade);
        state.registrationData.existingUserId = existingUserId || null;
        if (prefilledPersonalInfo) {
          state.registrationData.personalInfo = prefilledPersonalInfo;
        }
        if (prefilledAddress) {
          state.registrationData.address = prefilledAddress;
        }
        if (prefilledBusinessInfo) {
          state.registrationData.businessInfo = prefilledBusinessInfo;
        }
        state.registrationStep = 2;
      })
      .addCase(submitStep1.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(submitStep2.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitStep2.fulfilled, (state, action) => {
        state.loading = false;
        state.registrationStep = 3;
      })
      .addCase(submitStep2.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(submitStep3.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitStep3.fulfilled, (state, action) => {
        state.loading = false;
        if (state.registrationData.accountType === 'seller') {
          state.registrationStep = 4;
        } else {
          state.registrationStep = 5;
        }
      })
      .addCase(submitStep3.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(submitStep4.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitStep4.fulfilled, (state, action) => {
        state.loading = false;
        state.registrationStep = 5;
      })
      .addCase(submitStep4.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(uploadBusinessLogo.pending, (state) => {
        state.uploadingLogo = true;
        state.error = null;
      })
      .addCase(uploadBusinessLogo.fulfilled, (state, action) => {
        state.uploadingLogo = false;
        state.registrationData.logo = action.payload.logo;
      })
      .addCase(uploadBusinessLogo.rejected, (state, action) => {
        state.uploadingLogo = false;
        state.error = action.payload;
      })

      .addCase(uploadBusinessDocuments.pending, (state) => {
        state.uploadingDocuments = true;
        state.error = null;
      })
      .addCase(uploadBusinessDocuments.fulfilled, (state, action) => {
        state.uploadingDocuments = false;
        state.registrationData.documents = action.payload.documents;
      })
      .addCase(uploadBusinessDocuments.rejected, (state, action) => {
        state.uploadingDocuments = false;
        state.error = action.payload;
      })

      .addCase(sendVerificationCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendVerificationCode.fulfilled, (state, action) => {
        state.loading = false;
        state.verificationSent = true;
        state.maskedEmail = action.payload.maskedEmail;
      })
      .addCase(sendVerificationCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(verifyCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.loading = false;
        state.isEmailVerified = true;
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resendVerificationCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerificationCode.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(completeRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(completeRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setRegistrationStep,
  saveStepData,
  setLogo,
  setDocuments,
  clearRegistrationData,
  setError,
  clearError,
} = registrationSlice.actions;

export default registrationSlice.reducer;
