# 使用 Nginx 作為基礎映像
FROM nginx:alpine

# 複製所有 HTML 檔案到 Nginx 的預設目錄
COPY *.html /usr/share/nginx/html/
COPY *.md /usr/share/nginx/html/

# 暴露 80 端口
EXPOSE 80

# 啟動 Nginx
CMD ["nginx", "-g", "daemon off;"]
