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
  Textarea,
  Button,
} from "@chakra-ui/react";
import { FiMessageSquare } from "react-icons/fi";

const CommentForm = ({ accounts, isLoading, onLoading, showToast }) => {
  const [commentForm, setCommentForm] = useState({
    account_id: "",
    video_url: "",
    comment_text: "",
  });

  // تعيين الحساب الافتراضي عند تحميل المكون
  useEffect(() => {
    if (accounts.length > 0) {
      setCommentForm({
        ...commentForm,
        account_id: accounts[0].id.toString(),
      });
    }
  }, [accounts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCommentForm({
      ...commentForm,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !commentForm.account_id ||
      !commentForm.video_url ||
      !commentForm.comment_text
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
      await api.commentVideo({
        account_id: parseInt(commentForm.account_id),
        video_url: commentForm.video_url,
        comment_text: commentForm.comment_text,
      });

      showToast(
        "تم بنجاح",
        "تم إضافة التعليق بنجاح",
        "success"
      );

      // إعادة تعيين النموذج
      setCommentForm({
        ...commentForm,
        video_url: "",
        comment_text: "",
      });

      onLoading(false);
    } catch (error) {
      console.error("خطأ في إضافة التعليق:", error);
      showToast(
        "خطأ",
        "حدث خطأ أثناء إضافة التعليق",
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
            <FormControl id="comment_account_id" isRequired>
              <FormLabel>الحساب</FormLabel>
              <Select
                name="account_id"
                value={commentForm.account_id}
                onChange={handleInputChange}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl id="comment_video_url" isRequired>
              <FormLabel>رابط الفيديو</FormLabel>
              <Input
                name="video_url"
                value={commentForm.video_url}
                onChange={handleInputChange}
                placeholder="أدخل رابط الفيديو"
              />
            </FormControl>

            <FormControl id="comment_text" isRequired>
              <FormLabel>نص التعليق</FormLabel>
              <Textarea
                name="comment_text"
                value={commentForm.comment_text}
                onChange={handleInputChange}
                placeholder="أدخل نص التعليق"
                rows={3}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              leftIcon={<FiMessageSquare />}
              isLoading={isLoading}
              loadingText="جاري التنفيذ..."
            >
              إضافة تعليق
            </Button>
          </Stack>
        </form>
      </CardBody>
    </Card>
  );
};

export default CommentForm;
