import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Outlet } from "react-router-dom";
import "./App.css";
import { ChakraProvider } from '@chakra-ui/react'
import HomePage from './components/HomePage'

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <HomePage />
    </ChakraProvider>
  );
};

export default App;
