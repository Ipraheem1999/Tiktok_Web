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
  Switch,
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';

const Proxies = () => {
  const { user } = useAuth();
  const [proxies, setProxies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProxy, setSelectedProxy] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    address: '',
    country: 'saudi_arabia',
    is_active: true,
  });
  const toast = useToast();

  useEffect(() => {
    fetchProxies();
  }, []);

  const fetchProxies = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProxies();
      setProxies(data);
      setIsLoading(false);
    } catch (error) {
      console.error('خطأ في جلب البروكسيات:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب البروكسيات',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      setIsLoading(false);
    }
  };

  const handleOpenModal = (proxy = null) => {
    if (proxy) {
      setSelectedProxy(proxy);
      setFormData({
        address: proxy.address,
        country: proxy.country,
        is_active: proxy.is_active,
      });
    } else {
      setSelectedProxy(null);
      setFormData({
        address: '',
        country: 'saudi_arabia',
        is_active: true,
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

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSubmit = async () => {
    if (!formData.address || !formData.country) {
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

    try {
      if (selectedProxy) {
        // تحديث بروكسي موجود
        const proxyData = {
          address: formData.address,
          country: formData.country,
          is_active: formData.is_active,
        };
        
        await api.updateProxy(selectedProxy.id, proxyData);
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث البروكسي بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      } else {
        // إضافة بروكسي جديد
        const proxyData = {
          address: formData.address,
          country: formData.country,
          is_active: formData.is_active,
        };
        
        await api.createProxy(proxyData);
        
        toast({
          title: 'تمت الإضافة',
          description: 'تم إضافة البروكسي بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
      
      // إعادة تحميل البروكسيات
      fetchProxies();
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ البروكسي:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ البروكسي',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا البروكسي؟')) {
      try {
        await api.deleteProxy(id);
        
        toast({
          title: 'تم الحذف',
          description: 'تم حذف البروكسي بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        
        // إعادة تحميل البروكسيات
        fetchProxies();
      } catch (error) {
        console.error('خطأ في حذف البروكسي:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء حذف البروكسي',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    }
  };

  const toggleProxyStatus = async (id, currentStatus) => {
    try {
      const proxyData = {
        is_active: !currentStatus,
      };
      
      await api.updateProxy(id, proxyData);
      
      toast({
        title: 'تم التحديث',
        description: `تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} البروكسي بنجاح`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      
      // إعادة تحميل البروكسيات
      fetchProxies();
    } catch (error) {
      console.error('خطأ في تغيير حالة البروكسي:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تغيير حالة البروكسي',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
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
          إدارة البروكسي
        </Heading>
        <Text color="gray.600">
          إدارة البروكسيات المستخدمة للوصول من الدول المستهدفة.
        </Text>
      </Box>

      <Flex justify="space-between" mb={4}>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={() => handleOpenModal()}>
          إضافة بروكسي جديد
        </Button>
        <IconButton
          aria-label="تحديث"
          icon={<FiRefreshCw />}
          onClick={fetchProxies}
          isLoading={isLoading}
        />
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      ) : proxies.length === 0 ? (
        <Box textAlign="center" p={8} borderWidth={1} borderRadius="lg">
          <Text mb={4}>لا توجد بروكسيات مضافة بعد</Text>
          <Button colorScheme="brand" onClick={() => handleOpenModal()}>
            إضافة بروكسي جديد
          </Button>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>عنوان البروكسي</Th>
                <Th>الدولة</Th>
                <Th>الحالة</Th>
                <Th>الإجراءات</Th>
              </Tr>
            </Thead>
            <Tbody>
              {proxies.map((proxy) => (
                <Tr key={proxy.id}>
                  <Td>{proxy.address}</Td>
                  <Td>
                    <Badge colorScheme={getCountryBadgeColor(proxy.country)}>
                      {getCountryName(proxy.country)}
                    </Badge>
                  </Td>
                  <Td>
                    <Switch
                      isChecked={proxy.is_active}
                      onChange={() => toggleProxyStatus(proxy.id, proxy.is_active)}
                      colorScheme="green"
                    />
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="تعديل"
                        icon={<FiEdit />}
                        size="sm"
                        onClick={() => handleOpenModal(proxy)}
                      />
                      <IconButton
                        aria-label="حذف"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(proxy.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* نموذج إضافة/تعديل البروكسي */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>{selectedProxy ? 'تعديل بروكسي' : 'إضافة بروكسي جديد'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="address" isRequired mb={4}>
              <FormLabel>عنوان البروكسي</FormLabel>
              <Input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="أدخل عنوان البروكسي (مثال: 192.168.1.1:8080)"
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
            
            <FormControl id="is_active" display="flex" alignItems="center" mb={4}>
              <FormLabel mb="0">نشط</FormLabel>
              <Switch
                name="is_active"
                isChecked={formData.is_active}
                onChange={handleSwitchChange}
                colorScheme="green"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" ml={3} onClick={onClose}>
              إلغاء
            </Button>
            <Button colorScheme="brand" onClick={handleSubmit}>
              {selectedProxy ? 'تحديث' : 'إضافة'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Proxies;
