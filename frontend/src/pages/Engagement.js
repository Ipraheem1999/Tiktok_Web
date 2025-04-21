import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import {
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  Stack,
  Flex,
  Spinner,
  IconButton,
} from "@chakra-ui/react";
import {
  FiThumbsUp,
  FiMessageSquare,
  FiShare2,
  FiBookmark,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";

// مكونات فرعية لتحسين الأداء
import LikeForm from "./engagement/LikeForm";
import CommentForm from "./engagement/CommentForm";
import ShareForm from "./engagement/ShareForm";
import SaveForm from "./engagement/SaveForm";
import FollowForm from "./engagement/FollowForm";

const Engagement = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);

  // استخدام useCallback لتحسين الأداء
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getTikTokAccounts();
      setAccounts(data);
      setIsLoading(false);
    } catch (error) {
      console.error("خطأ في جلب الحسابات:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الحسابات",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      setIsLoading(false);
    }
  }, [toast]);

  // استخدام useEffect مع مصفوفة التبعيات المحسنة
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // معالج مشترك للتحميل
  const handleLoading = (isLoading) => {
    setIsLoading(isLoading);
  };

  // معالج مشترك للإشعارات
  const showToast = (title, description, status) => {
    toast({
      title,
      description,
      status,
      duration: 3000,
      isClosable: true,
      position: "top",
    });
  };

  return (
    <Box p={4}>
      <Box mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          التفاعل مع تيك توك
        </Heading>
        <Text color="gray.600">إدارة التفاعلات مع المحتوى على تيك توك.</Text>
      </Box>

      <Flex justify="flex-end" mb={4}>
        <IconButton
          aria-label="تحديث"
          icon={<FiRefreshCw />}
          onClick={fetchAccounts}
          isLoading={isLoading}
        />
      </Flex>

      {isLoading && accounts.length === 0 ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      ) : accounts.length === 0 ? (
        <Box textAlign="center" p={8} borderWidth={1} borderRadius="lg">
          <Text mb={4}>لا توجد حسابات مضافة بعد</Text>
          <Button
            colorScheme="brand"
            onClick={() => (window.location.href = "/tiktok-accounts")}
          >
            إضافة حساب جديد
          </Button>
        </Box>
      ) : (
        <Tabs
          isFitted
          variant="enclosed"
          colorScheme="brand"
          onChange={(index) => setActiveTab(index)}
        >
          <TabList mb="1em">
            <Tab>
              <FiThumbsUp /> الإعجاب
            </Tab>
            <Tab>
              <FiMessageSquare /> التعليق
            </Tab>
            <Tab>
              <FiShare2 /> المشاركة
            </Tab>
            <Tab>
              <FiBookmark /> الحفظ
            </Tab>
            <Tab>
              <FiUser /> المتابعة
            </Tab>
          </TabList>
          <TabPanels>
            {/* نموذج الإعجاب */}
            <TabPanel>
              <LikeForm 
                accounts={accounts} 
                isLoading={isLoading && activeTab === 0} 
                onLoading={handleLoading}
                showToast={showToast}
              />
            </TabPanel>

            {/* نموذج التعليق */}
            <TabPanel>
              <CommentForm 
                accounts={accounts} 
                isLoading={isLoading && activeTab === 1} 
                onLoading={handleLoading}
                showToast={showToast}
              />
            </TabPanel>

            {/* نموذج المشاركة */}
            <TabPanel>
              <ShareForm 
                accounts={accounts} 
                isLoading={isLoading && activeTab === 2} 
                onLoading={handleLoading}
                showToast={showToast}
              />
            </TabPanel>

            {/* نموذج الحفظ */}
            <TabPanel>
              <SaveForm 
                accounts={accounts} 
                isLoading={isLoading && activeTab === 3} 
                onLoading={handleLoading}
                showToast={showToast}
              />
            </TabPanel>

            {/* نموذج المتابعة */}
            <TabPanel>
              <FollowForm 
                accounts={accounts} 
                isLoading={isLoading && activeTab === 4} 
                onLoading={handleLoading}
                showToast={showToast}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default Engagement;
