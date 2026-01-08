import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiCamera, FiTrash2, FiUser, FiMail, FiPhone, FiSave, FiX, FiBriefcase, FiArrowRight } from 'react-icons/fi';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadAvatar,
  deleteAvatar,
} from '../redux/slices/userSlice';
import styles from '../styles/ProfilePage.module.css';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, status } = useSelector((state) => state.user);
  const { activeMode, user: authUser } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!profile) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, profile]);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateUserProfile(formData));
    if (updateUserProfile.fulfilled.match(result)) {
      setIsEditing(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      await dispatch(uploadAvatar(file));
      setAvatarPreview(null);
    }
  };

  const handleDeleteAvatar = async () => {
    if (window.confirm('Are you sure you want to delete your avatar?')) {
      await dispatch(deleteAvatar());
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  };

  const hasSellerAccount = Boolean(authUser && (authUser.role === 'seller' || authUser.accountType === 'seller'));
  const showFullBuyerProfile = !hasSellerAccount;

  if (status === 'loading' && !profile) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className={styles.avatar} />
            ) : profile?.avatar?.url ? (
              <img src={profile.avatar.url} alt={profile.fullName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <FiUser size={48} />
              </div>
            )}
            <button
              className={styles.avatarUploadBtn}
              onClick={() => fileInputRef.current?.click()}
              title="Change avatar"
            >
              <FiCamera />
            </button>
            {profile?.avatar?.url && (
              <button
                className={styles.avatarDeleteBtn}
                onClick={handleDeleteAvatar}
                title="Delete avatar"
              >
                <FiTrash2 />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <h2 className={styles.userName}>{profile?.fullName}</h2>
          <p className={styles.userRole}>
            {activeMode === 'seller' ? 'Seller' : activeMode === 'admin' ? 'Admin' : 'Buyer'}
          </p>
        </div>

        <div className={styles.profileInfo}>
          <div className={styles.sectionHeader}>
            <h3>Personal Information</h3>
            {showFullBuyerProfile &&
              (!isEditing ? (
                <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                  <FiEdit2 /> Edit Profile
                </button>
              ) : (
                <div className={styles.editActions}>
                  <button className={styles.saveBtn} onClick={handleSubmit}>
                    <FiSave /> Save
                  </button>
                  <button className={styles.cancelBtn} onClick={handleCancel}>
                    <FiX /> Cancel
                  </button>
                </div>
              ))}
          </div>

          {showFullBuyerProfile ? (
            <form onSubmit={handleSubmit} className={styles.profileForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    <FiUser /> First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  ) : (
                    <p className={styles.fieldValue}>{profile?.firstName}</p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <FiUser /> Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  ) : (
                    <p className={styles.fieldValue}>{profile?.lastName}</p>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>
                  <FiMail /> Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                ) : (
                  <p className={styles.fieldValue}>{profile?.email}</p>
                )}
                {!profile?.isVerified && (
                  <span className={styles.unverifiedBadge}>Email not verified</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  <FiPhone /> Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className={styles.fieldValue}>{profile?.phone || 'Not provided'}</p>
                )}
              </div>
            </form>
          ) : (
            <div className={styles.buyerSummaryCard}>
              <div className={styles.buyerSummaryHeader}>
                <div className={styles.buyerSummaryIcon}>
                  <FiUser />
                </div>
                <div>
                  <p className={styles.buyerSummaryLabel}>Buyer Account</p>
                  <p className={styles.buyerSummaryHint}>
                    Your detailed personal info now lives inside your seller profile. Checkout will still
                    use this saved buyer display name.
                  </p>
                </div>
              </div>
              <div className={styles.buyerSummaryContent}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryTitle}>Display Name</span>
                  <span className={styles.summaryValue}>
                    {profile?.buyerProfile?.displayName || profile?.fullName || 'Buyer'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {profile && profile.role !== 'seller' && (
          <div className={styles.sellerUpgrade}>
            <div className={styles.sellerContent}>
              <div className={styles.sellerIcon}>
                <FiBriefcase />
              </div>
              <div>
                <p className={styles.sellerBadge}>Grow With NovaMart</p>
                <h3>Ready to open your own store?</h3>
                <p>
                  Turn your buyer account into a full seller hub with store analytics, inventory tools, and payouts.
                  We’ll reuse your saved profile details to fast-track the process.
                </p>
              </div>
            </div>
            <button className={styles.sellerButton} onClick={() => navigate('/register?mode=seller&source=profile')}>
              Create Seller Account
              <FiArrowRight />
            </button>
          </div>
        )}

        <div className={styles.accountStats}>
          <div className={styles.statCard}>
            <h4>Member Since</h4>
            <p>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className={styles.statCard}>
            <h4>Last Login</h4>
            <p>{profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className={styles.statCard}>
            <h4>Account Status</h4>
            <p className={profile?.isActive ? styles.active : styles.inactive}>
              {profile?.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
