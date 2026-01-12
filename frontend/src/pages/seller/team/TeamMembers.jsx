import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiMail, FiLoader } from 'react-icons/fi';
import FeatureGuard from '../../../components/common/FeatureGuard';
import { fetchTeamMembers, inviteTeamMember, updateTeamMember, removeTeamMember } from '../../../redux/slices/sellerSlice';
import styles from './TeamMembers.module.css';

const TeamMembers = () => {
  const dispatch = useDispatch();
  const { teamMembers, teamStats, teamLoading } = useSelector((state) => state.seller);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    dispatch(fetchTeamMembers());
  }, [dispatch]);

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }
    setInviting(true);
    try {
      await dispatch(inviteTeamMember({ 
        email: inviteEmail, 
        name: inviteName,
        role: inviteRole 
      })).unwrap();
      toast.success('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('staff');
    } catch (error) {
      toast.error(error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    try {
      await dispatch(updateTeamMember({
        memberId: selectedMember._id,
        role: selectedMember.role,
        status: selectedMember.status,
      })).unwrap();
      toast.success('Team member updated');
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (error) {
      toast.error(error || 'Failed to update member');
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      await dispatch(removeTeamMember(memberId)).unwrap();
      toast.success('Team member removed');
    } catch (error) {
      toast.error(error || 'Failed to remove member');
    }
  };

  const stats = teamStats || {
    total: teamMembers.length,
    active: teamMembers.filter(m => m.status === 'active').length,
    pending: teamMembers.filter(m => m.status === 'pending').length,
    roles: [...new Set(teamMembers.map(m => m.role))].length,
  };

  if (teamLoading) {
    return (
      <FeatureGuard featureKey="unlimitedTeamMembers">
        <div className={styles.teamMembers}>
          <div className={styles.loading}>
            <FiLoader className={styles.spinner} />
            <p>Loading team members...</p>
          </div>
        </div>
      </FeatureGuard>
    );
  }

  return (
    <FeatureGuard featureKey="unlimitedTeamMembers">
      <div className={styles.teamMembers}>
        <div className={styles.header}>
          <div>
            <h1><FiUsers className={styles.headerIcon} /> Team Members</h1>
            <p>Manage your team and assign roles</p>
          </div>
          <button onClick={() => setShowInviteModal(true)} className={styles.inviteBtn}>
            <FiPlus /> Invite Member
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total Members</h3>
              <div className={styles.statValue}>{stats.total}</div>
            </div>
            <div className={styles.statCard}>
              <h3>Active</h3>
              <div className={styles.statValue}>{stats.active}</div>
            </div>
            <div className={styles.statCard}>
              <h3>Pending</h3>
              <div className={styles.statValue}>{stats.pending}</div>
            </div>
            <div className={styles.statCard}>
              <h3>Roles</h3>
              <div className={styles.statValue}>{stats.roles}</div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Team Members</h2>
            {teamMembers.length === 0 ? (
              <div className={styles.emptyState}>
                <FiUsers />
                <p>No team members yet</p>
                <span>Invite your first team member to get started</span>
              </div>
            ) : (
              <div className={styles.membersList}>
                {teamMembers.map((member) => (
                  <div key={member._id} className={styles.memberCard}>
                    <div className={styles.memberAvatar}>
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.memberInfo}>
                      <h3>{member.name || member.email.split('@')[0]}</h3>
                      <p>{member.email}</p>
                      <div className={styles.memberMeta}>
                        <span className={styles.memberRole}>{member.role}</span>
                        <span className={`${styles.statusBadge} ${styles[member.status]}`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                    <div className={styles.memberActions}>
                      <button onClick={() => handleEdit(member)} className={styles.actionBtn}>
                        <FiEdit2 /> Edit
                      </button>
                      <button onClick={() => handleRemove(member._id)} className={styles.actionBtn}>
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showInviteModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Invite Team Member</h2>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => setShowInviteModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button onClick={handleInvite} className={styles.sendBtn}>
                  <FiMail /> Send Invitation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};

export default TeamMembers;
