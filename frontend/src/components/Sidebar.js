import React from 'react';
import { Box, Flex, VStack, Icon, Text, Divider, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiGlobe, FiCalendar, FiThumbsUp, FiLogOut } from 'react-icons/fi';

const SidebarContent = ({ onClose, ...rest }) => {
  const location = useLocation();
  
  const NavItem = ({ icon, children, to, ...rest }) => {
    const isActive = location.pathname === to;
    const activeBg = useColorModeValue('brand.100', 'brand.900');
    const inactiveBg = useColorModeValue('white', 'gray.800');
    const activeColor = useColorModeValue('brand.500', 'white');
    const inactiveColor = useColorModeValue('gray.600', 'gray.300');
    
    return (
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : inactiveBg}
        color={isActive ? activeColor : inactiveColor}
        _hover={{
          bg: activeBg,
          color: activeColor,
        }}
        as={RouterLink}
        to={to}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            as={icon}
          />
        )}
        {children}
      </Flex>
    );
  };

  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold" color="brand.500">
          تيك توك أتمتة
        </Text>
      </Flex>
      <VStack spacing="1" align="stretch">
        <NavItem icon={FiHome} to="/">
          لوحة التحكم
        </NavItem>
        <NavItem icon={FiUsers} to="/tiktok-accounts">
          حسابات تيك توك
        </NavItem>
        <NavItem icon={FiGlobe} to="/proxies">
          البروكسي
        </NavItem>
        <NavItem icon={FiCalendar} to="/schedules">
          جدولة المنشورات
        </NavItem>
        <NavItem icon={FiThumbsUp} to="/engagement">
          التفاعل
        </NavItem>
        <Divider my="2" />
        <NavItem icon={FiLogOut} to="/login">
          تسجيل الخروج
        </NavItem>
      </VStack>
    </Box>
  );
};

export default SidebarContent;
