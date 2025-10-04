import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Camera, Mail, User, Edit3, Save, X, Heart, AtSign, Users, Calendar, CheckCircle } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import BackgroundShapes from '../components/BackgroundShapes';
import Notification from '../components/Notification';
import '../styles/auth.css';

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const { notification, showNotification, hideNotification } = useNotification();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: authUser?.firstName || '',
    lastName: authUser?.lastName || '',
    bio: authUser?.bio || '',
    interests: authUser?.interests || [],
    userType: authUser?.userType || 'both'
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      try {
        await updateProfile({ profilePic: base64Image });
        showNotification('Profile picture updated successfully!', 'success');
      } catch (error) {
        showNotification('Failed to update profile picture', 'error');
      }
    };
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      showNotification('Failed to update profile', 'error');
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      firstName: authUser?.firstName || '',
      lastName: authUser?.lastName || '',
      bio: authUser?.bio || '',
      interests: authUser?.interests || [],
      userType: authUser?.userType || 'both'
    });
    setIsEditing(false);
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const interestOptions = [
    { value: 'cooking', label: 'Cooking', icon: '🍳' },
    { value: 'baking', label: 'Baking', icon: '🧁' },
    { value: 'diy', label: 'DIY Crafts', icon: '🎨' },
    { value: 'home-decor', label: 'Home Decor', icon: '🏠' },
    { value: 'gardening', label: 'Gardening', icon: '🌱' },
    { value: 'healthy', label: 'Healthy Living', icon: '🥗' }
  ];

  const userTypeOptions = [
    { value: 'foodie', label: 'Foodie', description: 'Love cooking and recipes' },
    { value: 'crafter', label: 'Crafter', description: 'Passionate about DIY projects' },
    { value: 'both', label: 'Both', description: 'Enjoy cooking and crafting' }
  ];

  return (
    <div className="auth-container">
      <BackgroundShapes />
      <Notification notification={notification} onClose={hideNotification} />

      {/* Main Content */}
      <main className="auth-main" style={{ padding: '40px 20px' }}>
        {/* Profile Card */}
        <div className="auth-card" style={{ maxWidth: '900px', padding: '40px' }}>
          {/* Header */}
          <div className="auth-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h1>My Profile</h1>
              <p>Manage your account information and preferences</p>
            </div>
            <button
              onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
              className="auth-btn primary"
              style={{ width: 'auto', padding: '10px 20px' }}
            >
              {isEditing ? (
                <>
                  <X />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {/* Profile Picture Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={selectedImg || authUser?.profilePic || '/avatar.png'}
                alt="Profile"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid rgba(102, 126, 234, 0.3)',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)'
                }}
              />
              <label
                htmlFor="avatar-upload"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  transform: isUpdatingProfile ? 'none' : 'scale(1)',
                  opacity: isUpdatingProfile ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isUpdatingProfile) {
                    e.target.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <Camera style={{ width: '20px', height: '20px' }} />
                <input
                  type="file"
                  id="avatar-upload"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
              {isUpdatingProfile ? 'Uploading...' : 'Click the camera icon to update your photo'}
            </p>
          </div>

          {/* Profile Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
            {/* Left Column - Personal Information */}
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#2d3748', marginBottom: '20px' }}>Personal Information</h3>
              
              {/* Name Fields */}
              {isEditing ? (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <User />
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="form-input"
                      placeholder="Your first name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <User />
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="form-input"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', marginBottom: '15px' }}>
                    <User style={{ color: '#667eea', fontSize: '1.1rem' }} />
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2d3748' }}>Full Name</p>
                      <p style={{ color: '#2d3748' }}>{authUser?.fullName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email and Username */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', marginBottom: '15px' }}>
                  <Mail style={{ color: '#667eea', fontSize: '1.1rem' }} />
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2d3748' }}>Email Address</p>
                    <p style={{ color: '#2d3748' }}>{authUser?.email}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', marginBottom: '15px' }}>
                  <AtSign style={{ color: '#667eea', fontSize: '1.1rem' }} />
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2d3748' }}>Username</p>
                    <p style={{ color: '#2d3748' }}>@{authUser?.username}</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="form-input"
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                    style={{ resize: 'none', minHeight: '100px' }}
                  />
                ) : (
                  <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', minHeight: '100px' }}>
                    <p style={{ color: '#2d3748' }}>{authUser?.bio || 'No bio added yet.'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Preferences */}
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#2d3748', marginBottom: '20px' }}>Preferences</h3>
              
              {/* User Type */}
              <div className="form-group">
                <label className="form-label">I am a...</label>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {userTypeOptions.map((option) => (
                      <label key={option.value} className="checkbox-label" style={{ padding: '12px', border: '2px solid rgba(255, 255, 255, 0.3)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.8)' }}>
                        <input
                          type="radio"
                          name="userType"
                          value={option.value}
                          checked={formData.userType === option.value}
                          onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                        />
                        <span className="checkmark" style={{ borderRadius: '50%' }}></span>
                        <div>
                          <p style={{ fontWeight: '600', color: '#2d3748' }}>{option.label}</p>
                          <p style={{ fontSize: '0.85rem', color: '#666' }}>{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users style={{ color: '#667eea', fontSize: '1.1rem' }} />
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {userTypeOptions.find(opt => opt.value === authUser?.userType)?.label || 'Both'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Interests */}
              <div className="form-group">
                <label className="form-label">
                  <Heart />
                  Interests
                </label>
                {isEditing ? (
                  <div className="interest-tags">
                    {interestOptions.map((interest) => (
                      <label key={interest.value} className={`interest-tag ${formData.interests.includes(interest.value) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          value={interest.value}
                          checked={formData.interests.includes(interest.value)}
                          onChange={() => handleInterestToggle(interest.value)}
                        />
                        <span>{interest.icon} {interest.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="interest-tags">
                    {authUser?.interests?.length > 0 ? (
                      authUser.interests.map((interest) => {
                        const interestData = interestOptions.find(opt => opt.value === interest);
                        return (
                          <span key={interest} className="interest-tag selected">
                            <span>{interestData?.icon} {interestData?.label || interest}</span>
                          </span>
                        );
                      })
                    ) : (
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>No interests selected</p>
                    )}
                  </div>
                )}
              </div>

              {/* Save Button */}
              {isEditing && (
                <button
                  onClick={handleSaveProfile}
                  disabled={isUpdatingProfile}
                  className="auth-btn primary"
                  style={{ marginTop: '20px' }}
                >
                  {isUpdatingProfile ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#2d3748', marginBottom: '20px' }}>Account Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px' }}>
                <Calendar style={{ color: '#667eea', fontSize: '1.1rem' }} />
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2d3748' }}>Member Since</p>
                  <p style={{ color: '#2d3748' }}>{new Date(authUser?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px' }}>
                <CheckCircle style={{ color: '#27ae60', fontSize: '1.1rem' }} />
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2d3748' }}>Account Status</p>
                  <p style={{ color: '#27ae60', fontWeight: '600' }}>Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;