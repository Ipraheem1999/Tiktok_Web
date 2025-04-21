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
  Flex,
  Spinner,
  Textarea,
  FormHelperText,
  InputGroup,
  InputLeftAddon,
  Badge,
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiUpload, FiCalendar } from 'react-icons/fi';

const Schedules = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    account_id: '',
    video_file: null,
    caption: '',
    schedule_time: '',
    tags: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // جلب الحسابات والجداول الزمنية بالتوازي
      const [accountsData, schedulesData] = await Promise.all([
        api.getTikTokAccounts(),
        api.getSchedules()
      ]);
      
      setAccounts(accountsData);
      setSchedules(schedulesData);
      
      // تعيين الحساب الافتراضي في النموذج إذا كانت هناك حسابات
      if (accountsData.length > 0) {
        setFormData(prev => ({
          ...prev,
          account_id: accountsData[0].id.toString()
        }));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب البيانات',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      setIsLoading(false);
    }
  };

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setSelectedSchedule(schedule);
      setFormData({
        account_id: schedule.account_id.toString(),
        video_file: null,
        caption: schedule.caption,
        schedule_time: schedule.schedule_time,
        tags: schedule.tags,
      });
    } else {
      setSelectedSchedule(null);
      setFormData({
        account_id: accounts.length > 0 ? accounts[0].id.toString() : '',
        video_file: null,
        caption: '',
        schedule_time: '',
        tags: '',
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        video_file: e.target.files[0],
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.account_id || (!selectedSchedule && !formData.video_file) || !formData.caption || !formData.schedule_time) {
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
      if (selectedSchedule) {
        // تحديث جدولة موجودة
        const scheduleData = {
          account_id: parseInt(formData.account_id),
          caption: formData.caption,
          schedule_time: formData.schedule_time,
          tags: formData.tags,
        };
        
        await api.updateSchedule(selectedSchedule.id, scheduleData);
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث المنشور المجدول بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      } else {
        // إضافة جدولة جديدة
        const scheduleData = {
          account_id: parseInt(formData.account_id),
          caption: formData.caption,
          schedule_time: formData.schedule_time,
          tags: formData.tags,
          video_file: formData.video_file,
        };
        
        await api.createSchedule(scheduleData);
        
        toast({
          title: 'تمت الإضافة',
          description: 'تم إضافة المنشور المجدول بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
      
      // إعادة تحميل الجداول الزمنية
      fetchData();
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ المنشور المجدول:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ المنشور المجدول',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنشور المجدول؟')) {
      try {
        await api.deleteSchedule(id);
        
        toast({
          title: 'تم الحذف',
          description: 'تم حذف المنشور المجدول بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        
        // إعادة تحميل الجداول الزمنية
        fetchData();
      } catch (error) {
        console.error('خطأ في حذف المنشور المجدول:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء حذف المنشور المجدول',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'pending':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'failed':
        return 'فشل';
      case 'pending':
        return 'قيد الانتظار';
      default:
        return 'غير معروف';
    }
  };

  const formatDateTime = (dateTimeStr) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('ar-SA');
    } catch (error) {
      return dateTimeStr;
    }
  };

  return (
    <Box p={4}>
      <Box mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          جدولة المنشورات
        </Heading>
        <Text color="gray.600">
          إدارة وجدولة المنشورات على تيك توك.
        </Text>
      </Box>

      <Flex justify="space-between" mb={4}>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={() => handleOpenModal()}>
          إضافة منشور جديد
        </Button>
        <IconButton
          aria-label="تحديث"
          icon={<FiRefreshCw />}
          onClick={fetchData}
          isLoading={isLoading}
        />
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      ) : schedules.length === 0 ? (
        <Box textAlign="center" p={8} borderWidth={1} borderRadius="lg">
          <Text mb={4}>لا توجد منشورات مجدولة بعد</Text>
          <Button colorScheme="brand" onClick={() => handleOpenModal()}>
            إضافة منشور جديد
          </Button>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>الحساب</Th>
                <Th>النص</Th>
                <Th>وقت النشر</Th>
                <Th>الحالة</Th>
                <Th>الإجراءات</Th>
              </Tr>
            </Thead>
            <Tbody>
              {schedules.map((schedule) => (
                <Tr key={schedule.id}>
                  <Td>{schedule.account_username}</Td>
                  <Td>
                    <Text noOfLines={1}>{schedule.caption}</Text>
                  </Td>
                  <Td>{formatDateTime(schedule.schedule_time)}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(schedule.status)}>
                      {getStatusText(schedule.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="تعديل"
                        icon={<FiEdit />}
                        size="sm"
                        onClick={() => handleOpenModal(schedule)}
                      />
                      <IconButton
                        aria-label="حذف"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(schedule.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* نموذج إضافة/تعديل المنشور المجدول */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>{selectedSchedule ? 'تعديل منشور مجدول' : 'إضافة منشور جديد'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="account_id" isRequired mb={4}>
              <FormLabel>الحساب</FormLabel>
              <Select
                name="account_id"
                value={formData.account_id}
                onChange={handleInputChange}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            {!selectedSchedule && (
              <FormControl id="video_file" isRequired mb={4}>
                <FormLabel>ملف الفيديو</FormLabel>
                <InputGroup>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    display="none"
                    id="video-upload"
                  />
                  <Button
                    as="label"
                    htmlFor="video-upload"
                    leftIcon={<FiUpload />}
                    colorScheme="gray"
                    variant="outline"
                    w="full"
                  >
                    {formData.video_file ? formData.video_file.name : 'اختر ملف الفيديو'}
                  </Button>
                </InputGroup>
                <FormHelperText>يجب أن يكون الفيديو بتنسيق MP4 وحجم أقل من 50 ميجابايت</FormHelperText>
              </FormControl>
            )}
            
            <FormControl id="caption" isRequired mb={4}>
              <FormLabel>نص المنشور</FormLabel>
              <Textarea
                name="caption"
                value={formData.caption}
                onChange={handleInputChange}
                placeholder="أدخل نص المنشور"
                rows={3}
              />
            </FormControl>
            
            <FormControl id="schedule_time" isRequired mb={4}>
              <FormLabel>وقت النشر</FormLabel>
              <InputGroup>
                <InputLeftAddon children={<FiCalendar />} />
                <Input
                  name="schedule_time"
                  type="datetime-local"
                  value={formData.schedule_time}
                  onChange={handleInputChange}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl id="tags" mb={4}>
              <FormLabel>الوسوم</FormLabel>
              <Input
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="أدخل الوسوم (مثال: #تيك_توك #محتوى)"
              />
              <FormHelperText>افصل بين الوسوم بمسافة</FormHelperText>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" ml={3} onClick={onClose}>
              إلغاء
            </Button>
            <Button colorScheme="brand" onClick={handleSubmit}>
              {selectedSchedule ? 'تحديث' : 'إضافة'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Schedules;
