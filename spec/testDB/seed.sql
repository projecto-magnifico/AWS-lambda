DROP DATABASE IF EXISTS jd;
DROP DATABASE IF EXISTS delphi_test; 
CREATE DATABASE delphi_test; 

\c delphi_test;

CREATE TABLE threads (
    thread_id SERIAL PRIMARY KEY,
    name VARCHAR,
    summary VARCHAR,
    score DECIMAL NOT NULL,
    date_created DATE DEFAULT NOW(),
    img_url VARCHAR
);

CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    detail VARCHAR
);

CREATE TABLE keywords (
    keyword_id SERIAL PRIMARY KEY,
    word VARCHAR NOT NULL,
    thread_id INT NOT NULL,
    relevance DECIMAL NOT NULL,
    tag_id INT,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id),
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id)
);

CREATE TABLE sources (
    source_id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    logo_url VARCHAR
);

CREATE TABLE articles (
    article_id SERIAL PRIMARY KEY,
    thread_id INT NOT NULL,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    url VARCHAR NOT NULL,
    age INT NOT NULL,
    source_id INT NOT NULL,
    image_url VARCHAR,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id),
    FOREIGN KEY (source_id) REFERENCES sources(source_id)
);

CREATE TABLE snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    top_story_log VARCHAR NOT NULL,
    snap_date DATE DEFAULT NOW(),
    snap_time TIME DEFAULT NOW()
);