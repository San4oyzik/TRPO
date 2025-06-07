import { ToastContainer } from 'react-toastify';
import '../styles/toast.css';

export default function ToastProvider({ children }) {
  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="custom-toast-container"
        toastClassName="custom-toast"
      />
    </>
  );
}
