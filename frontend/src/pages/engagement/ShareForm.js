import React, { useState, useEffect } from "react";
import api from "../../api/api";
import {
  Card,
  CardBody,
  Stack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button,
} from "@chakra-ui/react";
import { FiShare2 } from "react-icons/fi";

const ShareForm = ({ accounts, isLoading, onLoading, showToast }) => {
  const [shareForm, setShareForm] = useState({
    account_id: "",
    video_url: "",
    share_type: "copy_link",
  });

  // تعيين الحساب الافتراضي عند تحميل المكون
  useEffect(() => {
    if (accounts.length > 0) {
      setShareForm({
        ...shareForm,
        account_id: accounts[0].id.toString(),
      });
    }
  }, [accounts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShareForm({
      ...shareForm,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !shareForm.account_id ||
      !shareForm.video_url ||
      !shareForm.share_type
    ) {
      showToast(
        "خطأ",
        "يرجى ملء جميع الحقول المطلوبة",
        "error"
      );
      return;
    }

    onLoading(true);

    try {
      await api.shareVideo({
        account_id: parseInt(shareForm.account_id),
        video_url: shareForm.video_url,
        share_type: shareForm.share_type,
      });

      showToast(
        "تم بنجاح",
        "تم مشاركة الفيديو بنجاح",
        "success"
      );

      // إعادة تعيين النموذج
      setShareForm({
        ...shareForm,
        video_url: "",
      });

      onLoading(false);
    } catch (error) {
      console.error("خطأ في مشاركة الفيديو:", error);
      showToast(
        "خطأ",
        "حدث خطأ أثناء مشاركة الفيديو",
        "error"
      );
      onLoading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl id="share_account_id" isRequired>
              <FormLabel>الحساب</FormLabel>
              <Select
                name="account_id"
                value={shareForm.account_id}
                onChange={handleInputChange}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl id="share_video_url" isRequired>
              <FormLabel>رابط الفيديو</FormLabel>
              <Input
                name="video_url"
                value={shareForm.video_url}
                onChange={handleInputChange}
                placeholder="أدخل رابط الفيديو"
              />
            </FormControl>

            <FormControl id="share_type" isRequired>
              <FormLabel>نوع المشاركة</FormLabel>
              <Select
                name="share_type"
                value={shareForm.share_type}
                onChange={handleInputChange}
              >
                <option value="copy_link">نسخ الرابط</option>
                <option value="facebook">فيسبوك</option>
                <option value="twitter">تويتر</option>
                <option value="whatsapp">واتساب</option>
                <option value="telegram">تيليجرام</option>
              </Select>
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              leftIcon={<FiShare2 />}
              isLoading={isLoading}
              loadingText="جاري التنفيذ..."
            >
              مشاركة الفيديو
            </Button>
          </Stack>
        </form>
      </CardBody>
    </Card>
  );
};

export default ShareForm;
