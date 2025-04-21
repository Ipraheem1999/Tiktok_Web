import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Icon,
  useColorModeValue,
  Card,
  CardBody,
  Button,
  VStack,
  HStack,
  Divider,
  Spinner,
} from '@chakra-ui/react';
import { FiUsers, FiGlobe, FiCalendar, FiThumbsUp, FiActivity } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

// مكون StatCard منفصل لتحسين الأداء
const StatCard = React.memo(({ title, value, icon, description, color }) => {
  return (
    <Card boxShadow="md" borderRadius="lg">
      <CardBody>
        <Flex justify="space-between" align="center">
          <Box>
            <StatLabel fontSize="sm" color="gray.500">{title}</StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold">{value}</StatNumber>
            <StatHelpText fontSize="xs">{description}</StatHelpText>
          </Box>
          <Flex
            w="12"
            h="12"
            align="center"
            justify="center"
            rounded="full"
            bg={`${color}.100`}
          >
            <Icon as={icon} w="6" h="6" color={`${color}.500`} />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
});

// مكون ScheduleItem منفصل لتحسين الأداء
const ScheduleItem = React.memo(({ schedule, index }) => {
  // استخدام useMemo لتحسين أداء الدوال المساعدة
  const statusColor = useMemo(() => {
    switch (schedule.status) {
      case 'completed':
        return 'green.500';
      case 'failed':
        return 'red.500';
      case 'pending':
        return 'orange.500';
      default:
        return 'gray.500';
    }
  }, [schedule.status]);

  const statusText = useMemo(() => {
    switch (schedule.status) {
      case 'completed':
        return 'مكتمل';
      case 'failed':
        return 'فشل';
      case 'pending':
        return 'قيد الانتظار';
      default:
        return 'غير معروف';
    }
  }, [schedule.status]);

  return (
    <React.Fragment>
      {index > 0 && <Divider />}
      <HStack justify="space-between">
        <Box>
          <Text fontWeight="bold">{schedule.account}</Text>
          <Text fontSize="sm" color="gray.500">{schedule.time}</Text>
        </Box>
        <Flex align="center">
          <Icon as={FiActivity} mr={2} color={statusColor} />
          <Text color={statusColor}>
            {statusText}
          </Text>
        </Flex>
      </HStack>
    </React.Fragment>
  );
});

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    accounts: 0,
    proxies: 0,
    schedules: 0,
    engagements: 0,
  });
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // استخدام useCallback لتحسين أداء دالة جلب البيانات
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // جلب البيانات الفعلية من الخادم
      const accountsPromise = api.getTikTokAccounts();
      const proxiesPromise = api.getProxies();
      const schedulesPromise = api.getSchedules();
      
      const [accountsData, proxiesData, schedulesData] = await Promise.all([
        accountsPromise,
        proxiesPromise,
        schedulesPromise
      ]);
      
      // محاولة جلب بيانات التفاعلات إذا كانت متوفرة
      let engagementsCount = 0;
      try {
        const engagementsData = await api.getEngagements();
        engagementsCount = engagementsData?.length || 0;
      } catch (error) {
        console.warn('تعذر جلب بيانات التفاعلات:', error);
      }
      
      setStats({
        accounts: accountsData.length,
        proxies: proxiesData.length,
        schedules: schedulesData.length,
        engagements: engagementsCount,
      });
      
      // ترتيب الجدولة حسب الوقت وأخذ أحدث 5 عناصر
      const sortedSchedules = [...schedulesData]
        .sort((a, b) => new Date(a.schedule_time) - new Date(b.schedule_time))
        .filter(schedule => new Date(schedule.schedule_time) > new Date())
        .slice(0, 5)
        .map(schedule => ({
          id: schedule.id,
          account: schedule.account_name || `حساب ${schedule.account_id}`,
          time: new Date(schedule.schedule_time).toLocaleString('ar-SA'),
          status: schedule.status || 'pending',
        }));
      
      setRecentSchedules(sortedSchedules);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      // في حالة الفشل، نستخدم البيانات الحالية
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // تحديث البيانات كل دقيقة
    const intervalId = setInterval(fetchData, 60000);
    
    // تنظيف الفاصل الزمني عند إلغاء تحميل المكون
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // استخدام useMemo لتحسين أداء مصفوفة البطاقات الإحصائية
  const statCards = useMemo(() => [
    {
      title: "حسابات تيك توك",
      value: stats.accounts,
      icon: FiUsers,
      description: "إجمالي الحسابات المدارة",
      color: "blue"
    },
    {
      title: "البروكسي",
      value: stats.proxies,
      icon: FiGlobe,
      description: "إجمالي البروكسيات النشطة",
      color: "purple"
    },
    {
      title: "المنشورات المجدولة",
      value: stats.schedules,
      icon: FiCalendar,
      description: "إجمالي المنشورات المجدولة",
      color: "orange"
    },
    {
      title: "التفاعلات",
      value: stats.engagements,
      icon: FiThumbsUp,
      description: "إجمالي التفاعلات هذا الأسبوع",
      color: "green"
    }
  ], [stats]);

  // معالج التحديث
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Box p={4}>
      <Box mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          لوحة التحكم
        </Heading>
        <Text color="gray.600">
          مرحبًا {user?.username || 'مستخدم'}، هذه هي نظرة عامة على نظام أتمتة تيك توك الخاص بك.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            description={card.description}
            color={card.color}
          />
        ))}
      </SimpleGrid>

      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="md">
            المنشورات المجدولة القادمة
          </Heading>
          <Button 
            size="sm" 
            colorScheme="brand" 
            variant="outline"
            onClick={handleRefresh}
            isLoading={isLoading}
          >
            تحديث
          </Button>
        </Flex>
        
        <Card boxShadow="md" borderRadius="lg">
          <CardBody>
            {isLoading ? (
              <Flex justify="center" py={4}>
                <Spinner size="md" color="brand.500" />
              </Flex>
            ) : recentSchedules.length === 0 ? (
              <Text textAlign="center">لا توجد منشورات مجدولة</Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {recentSchedules.map((schedule, index) => (
                  <ScheduleItem 
                    key={schedule.id}
                    schedule={schedule}
                    index={index}
                  />
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
      </Box>

      <Box>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="md">
            نشاط النظام
          </Heading>
          <Button 
            size="sm" 
            colorScheme="brand" 
            variant="outline"
            onClick={handleRefresh}
            isLoading={isLoading}
          >
            تحديث
          </Button>
        </Flex>
        
        <Card boxShadow="md" borderRadius="lg">
          <CardBody>
            {isLoading ? (
              <Flex justify="center" py={4}>
                <Spinner size="md" color="brand.500" />
              </Flex>
            ) : (
              <Text textAlign="center">لا توجد أنشطة حديثة</Text>
            )}
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
};

export default React.memo(Dashboard);
