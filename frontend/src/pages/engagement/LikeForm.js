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
import { FiThumbsUp } from "react-icons/fi";

const LikeForm = ({ accounts, isLoading, onLoading, showToast }) => {
  const [likeForm, setLikeForm] = useState({
    account_id: "",
    video_url: "",
  });

  // تعيين الحساب الافتراضي عند تحميل المكون
  useEffect(() => {
    if (accounts.length > 0) {
      setLikeForm({
        ...likeForm,
        account_id: accounts[0].id.toString(),
      });
    }
  }, [accounts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLikeForm({
      ...likeForm,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!likeForm.account_id || !likeForm.video_url) {
      showToast(
        "خطأ",
        "يرجى ملء جميع الحقول المطلوبة",
        "error"
      );
      return;
    }

    onLoading(true);

    try {
      await api.likeVideo({
        account_id: parseInt(likeForm.account_id),
        target_url: likeForm.video_url,
      });

      showToast(
        "تم بنجاح",
        "تم الإعجاب بالفيديو بنجاح",
        "success"
      );

      // إعادة تعيين النموذج
      setLikeForm({
        ...likeForm,
        video_url: "",
      });

      onLoading(false);
    } catch (error) {
      console.error("خطأ في الإعجاب بالفيديو:", error);
      showToast(
        "خطأ",
        "حدث خطأ أثناء الإعجاب بالفيديو",
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
            <FormControl id="like_account_id" isRequired>
              <FormLabel>الحساب</FormLabel>
              <Select
                name="account_id"
                value={likeForm.account_id}
                onChange={handleInputChange}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl id="like_video_url" isRequired>
              <FormLabel>رابط الفيديو</FormLabel>
              <Input
                name="video_url"
                value={likeForm.video_url}
                onChange={handleInputChange}
                placeholder="أدخل رابط الفيديو"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              leftIcon={<FiThumbsUp />}
              isLoading={isLoading}
              loadingText="جاري التنفيذ..."
            >
              الإعجاب بالفيديو
            </Button>
          </Stack>
        </form>
      </CardBody>
    </Card>
  );
};

export default LikeForm;
