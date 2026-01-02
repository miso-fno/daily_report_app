"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

/**
 * コメント入力フォームのバリデーションスキーマ
 */
const commentFormSchema = z.object({
  comment_text: z
    .string()
    .min(1, "コメントを入力してください")
    .max(500, "コメントは500文字以内で入力してください"),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

interface CommentFormProps {
  onSubmit: (commentText: string) => Promise<void>;
}

/**
 * コメント入力フォームコンポーネント
 * 上長のみ表示され、コメントを投稿できる
 */
export function CommentForm({ onSubmit }: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      comment_text: "",
    },
  });

  const handleSubmit = async (values: CommentFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values.comment_text);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">コメントを投稿</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="comment_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">コメント内容</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="コメントを入力してください..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "送信中..." : "コメントを送信"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
