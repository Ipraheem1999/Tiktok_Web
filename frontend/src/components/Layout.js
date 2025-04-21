import React from 'react';
import { Box, Flex, useColorModeValue, useDisclosure, Drawer, DrawerContent, IconButton } from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} dir="rtl">
      <Sidebar onClose={() => onClose} display={{ base: 'none', md: 'block' }} />
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <Sidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>
      
      {/* القائمة المتنقلة */}
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="فتح القائمة"
        icon={<FiMenu />}
        position="fixed"
        top="4"
        right="4"
        zIndex="1"
      />
      
      {/* المحتوى الرئيسي */}
      <Box mr={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
