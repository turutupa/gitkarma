package db

import (
	"fmt"
	"gitkarma/be/transfers"

	tbt "github.com/tigerbeetle/tigerbeetle-go/pkg/types"
)

func CreateAccount(id uint64) DBResponse[tbt.Account] {
	transfers := transfers.GetTransfers()
	fmt.Println(" > up to here fine < ")
	account := []tbt.Account{
		{
			ID:             tbt.ToUint128(id),
			DebitsPending:  tbt.ToUint128(0),
			DebitsPosted:   tbt.ToUint128(0),
			CreditsPending: tbt.ToUint128(0),
			CreditsPosted:  tbt.ToUint128(0),
			UserData128:    tbt.ToUint128(0),
			UserData64:     0,
			UserData32:     0,
			Reserved:       0,
			Ledger:         1,
			Code:           718,
			Flags:          0,
			Timestamp:      0,
		},
	}
	_, err := transfers.CreateAccounts(account)
	if err != nil {
		return DBResponse[tbt.Account]{Error: fmt.Errorf("error creating accounts: %s", err)}
	}
	return DBResponse[tbt.Account]{Data: account[0]}
}

func GetAccountById(id uint64) DBResponse[tbt.Account] {
	tranfers := transfers.GetTransfers()

	// Fetch account information
	lookupAccounts := []tbt.Uint128{tbt.ToUint128(id)}
	accounts, err := tranfers.LookupAccounts(lookupAccounts)
	if err != nil {
		return DBResponse[tbt.Account]{Error: fmt.Errorf("error fetching account: %s", err)}
	}

	if accounts == nil {
		return DBResponse[tbt.Account]{Error: fmt.Errorf("account not found")}
	}

	if len(accounts) == 0 {
		return DBResponse[tbt.Account]{Error: fmt.Errorf("account %d not found", id)}
	}

	account := accounts[0]
	return DBResponse[tbt.Account]{
		Data:  account,
		Error: nil,
	}
}
