FROM python:3.9-slim

RUN apt-get update --allow-releaseinfo-change \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        mariadb-client \
        nano \
        ruby-foreman \
    && rm -rf /var/lib/apt/lists/*

RUN pip install poetry
RUN poetry config virtualenvs.create false

COPY pyproject.toml ./
COPY poetry.lock ./
RUN poetry install

ENV DJANGO_SETTINGS_MODULE main.settings
ENV DJANGO_APP=main

#ENV GUNICORN_CMD_ARGS "-t 600 -w1"
ENV GUNICORN_CMD_ARGS ""

WORKDIR "/usr/django/app"
CMD ["sh", "-c", "./manage.py migrate && ./manage.py createcachetable && ./manage.py collectstatic --noinput && gunicorn -b 0.0.0.0:8000 -t 600 --workers 1 --threads 20 main.wsgi"]

COPY . /usr/django/app
