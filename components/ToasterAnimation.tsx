import Image from 'next/image';
import styles from './ToasterAnimation.module.css';

const ToasterAnimation = () => {
  return (
    <div className={styles.tooltipContainer} role="img" aria-label="Toaster Animation">
      <div className={styles.tooltip}>
        <Image src="/images/cta.svg" alt="Toaster Content" width={100} height={60} className="object-contain" />
        <span>Cook your own Companion!</span>
      </div>
      <span className={styles.toasterGroup}>
        <svg
          className={styles.toaster}
          width="100%"
          height="100%"
          viewBox="0 0 88 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="88" height="50"></rect>
          <path
            className={styles.block}
            d="M13.9561 1.74707H67.7607C73.9513 1.74707 78.9695 6.76558 78.9697 12.9561V48.0791H2.74707V12.9561C2.74733 6.76574 7.76574 1.74732 13.9561 1.74707Z"
            fill="#505050"
            stroke="#C0BABA"
            strokeWidth="1.49457"
          ></path>
          <rect
            x="2.5"
            y="43.3478"
            width="76.7174"
            height="4.97826"
            fill="#A6A4A4"
            stroke="#C0BABA"
          ></rect>
          <path
            className={styles.lever}
            d="M84.2008 13.3305C84.8197 13.3305 85.3217 13.8318 85.3219 14.4507V17.4399C85.3219 18.059 84.8199 18.561 84.2008 18.561H80.0914V13.3305H84.2008Z"
            fill="#A6A4A4"
            stroke="#C0BABA"
            strokeWidth="0.747283"
          ></path>
          <path
            d="M8.22558 18.9348C8.22558 18.9348 6.95407 11.7886 10.1771 8.8166C12.9835 6.22883 19.9348 7.13024 19.9348 7.13024"
            stroke="white"
            strokeOpacity="0.125"
            strokeWidth="1.49457"
          ></path>
          <circle
            className={styles.timer}
            cx="67.7609"
            cy="24.913"
            r="2.98913"
            fill="#A6A4A4"
          ></circle>
          <circle
            cx="67.7609"
            cy="24.913"
            r="3.36277"
            stroke="white"
            strokeOpacity="0.5"
            strokeWidth="0.747283"
            strokeLinecap="square"
          ></circle>
          <circle cx="67.7609" cy="33.8804" r="2.98913" fill="#A6A4A4"></circle>
          <circle
            cx="67.7609"
            cy="33.8804"
            r="3.36277"
            stroke="white"
            strokeOpacity="0.5"
            strokeWidth="0.747283"
            strokeLinecap="square"
          ></circle>
        </svg>
      </span>
    </div>
  );
};

export default ToasterAnimation;
