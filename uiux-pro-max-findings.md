# UI/UX Pro Max findings

Nguồn: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

Các nguyên tắc phù hợp với landing page Tạp Hóa POS:

- Dùng landing pattern Hero-Centric + Social Proof; CTA chính phải nằm trên fold và được lặp lại ở cuối trang.
- Hiệu ứng nên là soft shadows, subtle depth, context-appropriate transitions và gentle hover states; tránh animation gắt, neon hoặc gradient tím/hồng kiểu AI.
- Checklist bắt buộc: icon có ngữ nghĩa, clickable elements có trạng thái hover/focus/press, timing phù hợp nền tảng, tương phản văn bản tối thiểu, focus bàn phím nhìn thấy, tôn trọng prefers-reduced-motion và responsive ở 375/768/1024/1440px.
- Text dài, chip, badge phải tự reflow; không để clipping. Ý nghĩa badge không chỉ dựa vào màu; trạng thái cần có nhãn văn bản.
- Rapid interactions có thể hủy animation, nhưng trạng thái cuối và focus phải chính xác.
- Hướng áp dụng cho Tạp Hóa POS: giữ xanh chai #173B2A và vàng #F4C553; thêm transition fade/translate nhỏ, card lift khi hover, button scale nhẹ khi press; không dùng parallax nặng. Form lead cần label rõ, trạng thái loading/success/error và autocomplete phù hợp.

Ghi chú phạm vi: repository là một bộ design intelligence/skill có catalog style, palette, typography, landing patterns và UX rules; không nên copy nguyên framework vào Expo app. Chỉ áp dụng các nguyên tắc tương thích React Native Web và giữ khả năng mobile.
