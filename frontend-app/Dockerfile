FROM httpd:2.4.69
WORKDIR /var/www/html/
COPY frontend.conf /usr/local/apache2/conf/extra/
RUN echo "LoadModule rewrite_module modules/mod_rewrite.so" >> "/usr/local/apache2/conf/httpd.conf"
RUN echo "Include conf/extra/frontend.conf" >> "/usr/local/apache2/conf/httpd.conf"
CMD ["httpd-foreground"]
COPY dist/browser/ /var/www/html/
