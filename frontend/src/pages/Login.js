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
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
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
    
    const success = await login(username, password);
    
    if (!success && !error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تسجيل الدخول',
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
                تسجيل الدخول
              </Heading>
              <Text color="gray.600">
                قم بتسجيل الدخول للوصول إلى نظام أتمتة تيك توك
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
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                  />
                </FormControl>
                
                <FormControl id="password" isRequired>
                  <FormLabel>كلمة المرور</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                
                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  width="full"
                  mt={4}
                  isLoading={loading}
                  loadingText="جاري تسجيل الدخول..."
                >
                  تسجيل الدخول
                </Button>
              </VStack>
            </form>
            
            <Text mt={6} textAlign="center">
              ليس لديك حساب؟{' '}
              <Link as={RouterLink} to="/register" color="brand.500" fontWeight="bold">
                إنشاء حساب جديد
              </Link>
            </Text>
          </CardBody>
        </Card>
      </Container>
    </Flex>
  );
};

export default Login;
