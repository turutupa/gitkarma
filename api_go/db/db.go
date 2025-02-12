package db

import (
	"fmt"
	log "gitkarma/be/logger"

	"github.com/gocql/gocql"
	"github.com/scylladb/gocqlx/v3"
	"go.uber.org/zap"
)

var (
	db *gocqlx.Session // db session
	ks string          // keyspace
)

func DBConnect(hostname string, keyspace string) {
	hosts := []string{"127.0.0.1:9042"}
	cluster := gocql.NewCluster(hosts...)
	session, err := gocqlx.WrapSession(cluster.CreateSession())
	if err != nil {
		log.Fatal(err.Error())
	}
	migration(session, keyspace)
	ks = keyspace
	db = &session
}

func GetDB() *gocqlx.Session {
	return db
}

func migration(session gocqlx.Session, keyspace string) {
	err := session.ExecStmt(fmt.Sprintf(
		`CREATE KEYSPACE IF NOT EXISTS %s WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`,
		keyspace,
	))
	if err != nil {
		log.Fatal("create keyspace:", zap.Error(err))
	}

	// create repo table
	err = session.ExecStmt(fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s.repo (
		id uuid PRIMARY KEY,
		name text,
		webhook text)`, keyspace))
	if err != nil {
		log.Fatal("create table:", zap.Error(err))
	}

	// create user table
	err = session.ExecStmt(fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s.user (
		username text PRIMARY KEY,
		id bigint,
		email text,
		password text)`, keyspace))
	if err != nil {
		log.Fatal("create table:", zap.Error(err))
	}
}
