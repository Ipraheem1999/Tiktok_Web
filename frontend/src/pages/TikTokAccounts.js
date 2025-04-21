import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import {
  Box,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  HStack,
  Badge,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';

const TikTokAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    country: 'saudi_arabia',
    proxy: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTikTokAccounts();
      setAccounts(data);
      setIsLoading(false);
    } catch (error) {
      console.error('خطأ في جلب الحسابات:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب الحسابات',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      setIsLoading(false);
    }
  };

  const handleOpenModal = (account = null) => {
    if (account) {
      setSelectedAccount(account);
      setFormData({
        username: account.username,
        password: '', // لا نعرض كلمة المرور لأسباب أمنية
        country: account.country,
        proxy: account.proxy || '',
      });
    } else {
      setSelectedAccount(null);
      setFormData({
        username: '',
        password: '',
        country: 'saudi_arabia',
        proxy: '',
      });
    }
    onOpen();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.country) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    if (!selectedAccount && !formData.password) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور مطلوبة عند إضافة حساب جديد',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    try {
      if (selectedAccount) {
        // تحديث حساب موجود
        const accountData = {
          username: formData.username,
          country: formData.country,
          proxy: formData.proxy || null,
        };
        
        // إضافة كلمة المرور فقط إذا تم تغييرها
        if (formData.password) {
          accountData.password = formData.password;
        }
        
        await api.updateTikTokAccount(selectedAccount.id, accountData);
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الحساب بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      } else {
        // إضافة حساب جديد
        const accountData = {
          username: formData.username,
          password: formData.password,
          country: formData.country,
          proxy: formData.proxy || null,
        };
        
        await api.createTikTokAccount(accountData);
        
        toast({
          title: 'تمت الإضافة',
          description: 'تم إضافة الحساب بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
      
      // إعادة تحميل الحسابات
      fetchAccounts();
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ الحساب:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الحساب',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
      try {
        await api.deleteTikTokAccount(id);
        
        toast({
          title: 'تم الحذف',
          description: 'تم حذف الحساب بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        
        // إعادة تحميل الحسابات
        fetchAccounts();
      } catch (error) {
        console.error('خطأ في حذف الحساب:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء حذف الحساب',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    }
  };

  const getCountryName = (countryCode) => {
    switch (countryCode) {
      case 'saudi_arabia':
        return 'السعودية';
      case 'uae':
        return 'الإمارات';
      case 'kuwait':
        return 'الكويت';
      case 'egypt':
        return 'مصر';
      default:
        return countryCode;
    }
  };

  const getCountryBadgeColor = (countryCode) => {
    switch (countryCode) {
      case 'saudi_arabia':
        return 'green';
      case 'uae':
        return 'blue';
      case 'kuwait':
        return 'purple';
      case 'egypt':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <Box p={4}>
      <Box mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          حسابات تيك توك
        </Heading>
        <Text color="gray.600">
          إدارة حسابات تيك توك المستخدمة في نظام الأتمتة.
        </Text>
      </Box>

      <Flex justify="space-between" mb={4}>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={() => handleOpenModal()}>
          إضافة حساب جديد
        </Button>
        <IconButton
          aria-label="تحديث"
          icon={<FiRefreshCw />}
          onClick={fetchAccounts}
          isLoading={isLoading}
        />
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      ) : accounts.length === 0 ? (
        <Box textAlign="center" p={8} borderWidth={1} borderRadius="lg">
          <Text mb={4}>لا توجد حسابات مضافة بعد</Text>
          <Button colorScheme="brand" onClick={() => handleOpenModal()}>
            إضافة حساب جديد
          </Button>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>اسم المستخدم</Th>
                <Th>الدولة</Th>
                <Th>البروكسي</Th>
                <Th>الإجراءات</Th>
              </Tr>
            </Thead>
            <Tbody>
              {accounts.map((account) => (
                <Tr key={account.id}>
                  <Td>{account.username}</Td>
                  <Td>
                    <Badge colorScheme={getCountryBadgeColor(account.country)}>
                      {getCountryName(account.country)}
                    </Badge>
                  </Td>
                  <Td>{account.proxy || 'لا يوجد'}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="تعديل"
                        icon={<FiEdit />}
                        size="sm"
                        onClick={() => handleOpenModal(account)}
                      />
                      <IconButton
                        aria-label="حذف"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(account.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* نموذج إضافة/تعديل الحساب */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>{selectedAccount ? 'تعديل حساب' : 'إضافة حساب جديد'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="username" isRequired mb={4}>
              <FormLabel>اسم المستخدم</FormLabel>
              <Input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="أدخل اسم المستخدم"
              />
            </FormControl>
            
            <FormControl id="password" isRequired={!selectedAccount} mb={4}>
              <FormLabel>{selectedAccount ? 'كلمة المرور (اتركها فارغة إذا لم ترغب في تغييرها)' : 'كلمة المرور'}</FormLabel>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="أدخل كلمة المرور"
              />
            </FormControl>
            
            <FormControl id="country" isRequired mb={4}>
              <FormLabel>الدولة</FormLabel>
              <Select name="country" value={formData.country} onChange={handleInputChange}>
                <option value="saudi_arabia">السعودية</option>
                <option value="uae">الإمارات</option>
                <option value="kuwait">الكويت</option>
                <option value="egypt">مصر</option>
              </Select>
            </FormControl>
            
            <FormControl id="proxy" mb={4}>
              <FormLabel>البروكسي (اختياري)</FormLabel>
              <Input
                name="proxy"
                value={formData.proxy}
                onChange={handleInputChange}
                placeholder="أدخل عنوان البروكسي (مثال: 192.168.1.1:8080)"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" ml={3} onClick={onClose}>
              إلغاء
            </Button>
            <Button colorScheme="brand" onClick={handleSubmit}>
              {selectedAccount ? 'تحديث' : 'إضافة'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TikTokAccounts;
