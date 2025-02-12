package transfers

import (
	log "gitkarma/be/logger"

	tb "github.com/tigerbeetle/tigerbeetle-go"
	tbt "github.com/tigerbeetle/tigerbeetle-go/pkg/types"
	"go.uber.org/zap"
)

var (
	transfers tb.Client
)

func TransfersConnect(port string, concurrencyMax uint) tb.Client {
	if port == "" {
		port = "3001"
	}
	clientInstance, err := tb.NewClient(tbt.ToUint128(0), []string{port}, 1024)
	if err != nil {
		log.Fatal("Error creating tiger beetle client: %s", zap.Error(err))
	}
	transfers = clientInstance
	return clientInstance
}

func GetTransfers() tb.Client {
	return transfers
}
