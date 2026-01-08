import { FiShoppingBag, FiBriefcase, FiShield } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveMode } from '../../redux/slices/authSlice.js';
import styles from '../../styles/ModeSwitch.module.css';

const ModeSwitch = ({ onChange }) => {
  const dispatch = useDispatch();
  const { user, activeMode } = useSelector((state) => state.auth);

  if (!user) {
    return null;
  }

  const canUseBuyer = (user.role !== 'seller' && user.accountType !== 'seller') || user.hasBuyerProfile;

  const modes = [
    { id: 'buyer', label: 'Buyer', icon: FiShoppingBag, visible: canUseBuyer },
    {
      id: 'seller',
      label: 'Seller',
      icon: FiBriefcase,
      visible: user.role === 'seller' || user.accountType === 'seller',
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: FiShield,
      visible: user.role === 'admin' || user.accountType === 'admin',
    },
  ].filter((mode) => mode.visible);

  if (modes.length <= 1) {
    return null;
  }

  const handleClick = (mode) => {
    if (mode === activeMode) return;
    dispatch(setActiveMode(mode));
    onChange?.(mode);
  };

  return (
    <div className={styles.switch}>
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => handleClick(mode.id)}
          className={`${styles.option} ${activeMode === mode.id ? styles.active : ''}`}
        >
          <mode.icon />
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ModeSwitch;
