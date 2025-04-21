import React, { useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  FormHelperText,
  Alert,
  AlertIcon,
  Flex,
  Spinner,
  useColorModeValue,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { FiUser } from "react-icons/fi";
import api from "../../api/api";

const FollowForm = ({ accounts, isLoading, onLoading, showToast }) => {
  const [formData, setFormData] = useState({
    account_id: "",
    username: "",
    unfollow: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // إعادة تعيين رسائل الخطأ والنجاح عند تغيير البيانات
    setError("");
    setSuccess(false);
  };

  const handleToggleUnfollow = () => {
    setFormData({
      ...formData,
      unfollow: !formData.unfollow,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من صحة البيانات
    if (!formData.account_id) {
      setError("يرجى اختيار حساب تيك توك");
      return;
    }
    
    if (!formData.username) {
      setError("يرجى إدخال اسم المستخدم للمتابعة");
      return;
    }

    setSubmitting(true);
    onLoading(true);
    
    try {
      const response = await api.followUser({
        account_id: formData.account_id,
        username: formData.username,
        unfollow: formData.unfollow,
      });
      
      setSuccess(true);
      showToast(
        "تم بنجاح",
        formData.unfollow 
          ? `تم إلغاء متابعة المستخدم ${formData.username} بنجاح` 
          : `تمت متابعة المستخدم ${formData.username} بنجاح`,
        "success"
      );
      
      // إعادة تعيين النموذج
      setFormData({
        account_id: "",
        username: "",
        unfollow: false,
      });
    } catch (error) {
      console.error("خطأ في متابعة المستخدم:", error);
      setError(
        error.response?.data?.detail || 
        "حدث خطأ أثناء محاولة متابعة المستخدم. يرجى المحاولة مرة أخرى."
      );
      showToast(
        "خطأ",
        "فشلت عملية المتابعة. يرجى التحقق من اسم المستخدم والمحاولة مرة أخرى.",
        "error"
      );
    } finally {
      setSubmitting(false);
      onLoading(false);
    }
  };

  return (
    <Card borderWidth="1px" borderColor={borderColor} bg={cardBg} shadow="md">
      <CardBody>
        <Box as="form" onSubmit={handleSubmit}>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert status="success" mb={4} borderRadius="md">
              <AlertIcon />
              {formData.unfollow 
                ? "تم إلغاء المتابعة بنجاح" 
                : "تمت المتابعة بنجاح"}
            </Alert>
          )}
          
          <FormControl id="follow_account_id" mb={4} isRequired>
            <FormLabel>حساب تيك توك</FormLabel>
            <Select
              name="account_id"
              value={formData.account_id}
              onChange={handleChange}
              placeholder="اختر حساب تيك توك"
              isDisabled={submitting}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.username} ({account.country})
                </option>
              ))}
            </Select>
            <FormHelperText>
              اختر الحساب الذي سيقوم بالمتابعة
            </FormHelperText>
          </FormControl>
          
          <FormControl id="follow_username" mb={4} isRequired>
            <FormLabel>اسم المستخدم للمتابعة</FormLabel>
            <Input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="أدخل اسم المستخدم على تيك توك"
              isDisabled={submitting}
            />
            <FormHelperText>
              أدخل اسم المستخدم الذي تريد متابعته على تيك توك
            </FormHelperText>
          </FormControl>
          
          <Button
            colorScheme={formData.unfollow ? "red" : "brand"}
            variant="outline"
            mb={4}
            onClick={handleToggleUnfollow}
            leftIcon={<FiUser />}
            isDisabled={submitting}
          >
            {formData.unfollow ? "إلغاء المتابعة" : "متابعة"}
          </Button>
          
          <Flex justify="flex-end">
            <Button
              type="submit"
              colorScheme="brand"
              isLoading={submitting}
              loadingText="جاري التنفيذ..."
              leftIcon={<FiUser />}
            >
              {formData.unfollow ? "إلغاء المتابعة" : "متابعة"}
            </Button>
          </Flex>
        </Box>
      </CardBody>
    </Card>
  );
};

export default FollowForm;
