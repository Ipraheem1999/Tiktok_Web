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
import { FiBookmark } from "react-icons/fi";

const SaveForm = ({ accounts, isLoading, onLoading, showToast }) => {
  const [saveForm, setSaveForm] = useState({
    account_id: "",
    video_url: "",
  });

  // تعيين الحساب الافتراضي عند تحميل المكون
  useEffect(() => {
    if (accounts.length > 0) {
      setSaveForm({
        ...saveForm,
        account_id: accounts[0].id.toString(),
      });
    }
  }, [accounts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSaveForm({
      ...saveForm,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!saveForm.account_id || !saveForm.video_url) {
      showToast(
        "خطأ",
        "يرجى ملء جميع الحقول المطلوبة",
        "error"
      );
      return;
    }

    onLoading(true);

    try {
      await api.saveVideo({
        account_id: parseInt(saveForm.account_id),
        video_url: saveForm.video_url,
      });

      showToast(
        "تم بنجاح",
        "تم حفظ الفيديو بنجاح",
        "success"
      );

      // إعادة تعيين النموذج
      setSaveForm({
        ...saveForm,
        video_url: "",
      });

      onLoading(false);
    } catch (error) {
      console.error("خطأ في حفظ الفيديو:", error);
      showToast(
        "خطأ",
        "حدث خطأ أثناء حفظ الفيديو",
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
            <FormControl id="save_account_id" isRequired>
              <FormLabel>الحساب</FormLabel>
              <Select
                name="account_id"
                value={saveForm.account_id}
                onChange={handleInputChange}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl id="save_video_url" isRequired>
              <FormLabel>رابط الفيديو</FormLabel>
              <Input
                name="video_url"
                value={saveForm.video_url}
                onChange={handleInputChange}
                placeholder="أدخل رابط الفيديو"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              leftIcon={<FiBookmark />}
              isLoading={isLoading}
              loadingText="جاري التنفيذ..."
            >
              حفظ الفيديو
            </Button>
          </Stack>
        </form>
      </CardBody>
    </Card>
  );
};

export default SaveForm;
