import React, { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Link,
  useToast,
  InputGroup,
  InputRightElement,
  Flex,
  Container,
  Card,
  CardBody,
  Image,
  VStack,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading, error } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من صحة البيانات
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
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
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمات المرور غير متطابقة',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    // إنشاء الحساب
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };
    
    const success = await register(userData);
    
    if (success) {
      toast({
        title: 'تم إنشاء الحساب',
        description: 'تم إنشاء حسابك بنجاح وتسجيل الدخول',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } else if (!error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء الحساب',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Container maxW="lg" py={12}>
        <Card shadow="lg" rounded="lg" p={6}>
          <CardBody>
            <Box textAlign="center" mb={8}>
              <Image
                src="/logo.png"
                alt="TikTok Automation"
                mx="auto"
                h="80px"
                fallbackSrc="https://via.placeholder.com/150x80?text=TikTok+Automation"
              />
              <Heading as="h1" size="xl" mt={4} mb={2}>
                إنشاء حساب جديد
              </Heading>
              <Text color="gray.600">
                قم بإنشاء حساب للوصول إلى نظام أتمتة تيك توك
              </Text>
            </Box>
            
            {error && (
              <Box
                p={4}
                mb={4}
                color="red.500"
                bg="red.50"
                rounded="md"
                textAlign="center"
              >
                {error}
              </Box>
            )}
            
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl id="username" isRequired>
                  <FormLabel>اسم المستخدم</FormLabel>
                  <Input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="أدخل اسم المستخدم"
                  />
                </FormControl>
                
                <FormControl id="email" isRequired>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </FormControl>
                
                <FormControl id="password" isRequired>
                  <FormLabel>كلمة المرور</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="أدخل كلمة المرور"
                    />
                    <InputRightElement width="3rem">
                      <Button
                        h="1.5rem"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        bg="transparent"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                
                <FormControl id="confirmPassword" isRequired>
                  <FormLabel>تأكيد كلمة المرور</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="أعد إدخال كلمة المرور"
                    />
                    <InputRightElement width="3rem">
                      <Button
                        h="1.5rem"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        bg="transparent"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                
                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  width="full"
                  mt={4}
                  isLoading={loading}
                  loadingText="جاري إنشاء الحساب..."
                >
                  إنشاء حساب
                </Button>
              </VStack>
            </form>
            
            <Text mt={6} textAlign="center">
              لديك حساب بالفعل؟{' '}
              <Link as={RouterLink} to="/login" color="brand.500" fontWeight="bold">
                تسجيل الدخول
              </Link>
            </Text>
          </CardBody>
        </Card>
      </Container>
    </Flex>
  );
};

export default Register;
