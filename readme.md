## Backend
* npm install
* .env
* npx prisma db push
* npm run build
* npm start

---
* sudo dnf install nginx -y
* sudo dnf install certbot python3-certbot-nginx -y

```nginx
# /etc/nginx/conf.d/yds-backend.conf

server {
    listen 80;
    server_name api.siteniz.com; # KENDİ DOMAININIZ

    location / {
        proxy_pass http://localhost:3000; # Node.js backend portunuz
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

* sudo systemctl enable nginx
* sudo nginx -t
* sudo systemctl restart nginx
* sudo certbot --nginx -d api.siteniz.com