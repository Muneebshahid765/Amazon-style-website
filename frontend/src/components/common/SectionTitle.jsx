import styles from '../../styles/SectionTitle.module.css';

const SectionTitle = ({ eyebrow, title, description }) => (
  <div className={styles.wrapper}>
    {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
    <h2>{title}</h2>
    {description && <p className={styles.description}>{description}</p>}
  </div>
);

export default SectionTitle;
