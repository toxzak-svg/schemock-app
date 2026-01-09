# Data Flow

This document describes how data flows through the Schemock system, from initial configuration to HTTP responses.

## Table of Contents

- [Overview](#overview)
- [Initialization Flow](#initialization-flow)
- [Request Lifecycle](#request-lifecycle)
- [Schema Parsing Flow](#schema-parsing-flow)
- [Mock Data Generation Flow](#mock-data-generation-flow)
- [Response Flow](#response-flow)
- [Error Flow](#error-flow)
- [Cache Flow](#cache-flow)

## Overview

Schemock processes data through several distinct phases:

1. **Initialization**: Server creation, configuration, and route registration
2. **Request Processing**: HTTP request reception, middleware application, route matching
3. **Data Generation**: Schema parsing, mock data generation, caching
4. **Response**: Branding, logging, and HTTP response delivery

```mermaid
graph LR
    subgraph "Initialization"
        Config[Configuration]
        Server[Server Setup]
        Routes[Route Registration]
    end

    subgraph "Request Processing"
        HTTP[HTTP Request]
        Middleware[Middleware Pipeline]
        Routing[Route Matching]
    end

    subgraph "Data Generation"
        Schema[Schema Parsing]
        Cache[Cache Check]
        Generation[Data Generation]
    end

    subgraph "Response"
        Branding[Add Branding]
        Logging[Log Response]
        Response[HTTP Response]
    end

    Config --> Server
    Server --> Routes

    HTTP --> Middleware
    Middleware --> Routing
    Routing --> Schema
    Schema --> Cache
    Cache --> Generation
    Generation --> Branding
    Branding --> Logging
    Logging --> Response
```

## Initialization Flow

### Server Creation Flow

```mermaid
sequenceDiagram
    participant User as Developer
    participant CLI as CLI
    participant Entry as Entry Point
    participant Validator as Validation
    participant Server as ServerGenerator
    participant MW as Middleware
    participant Routes as Route Setup
    participant Logger as Logger

    User->>CLI: schemock start schema.json
    CLI->>Entry: createMockServer(schema, options)
    Entry->>Validator: validateSchema(schema, strict)
    Validator-->>Entry: Schema valid
    Entry->>Validator: validatePort(port)
    Validator-->>Entry: Port valid
    Entry->>Server: new ServerGenerator(config)
    Server->>Logger: setLogLevel(logLevel)
    Server->>Server: setupMiddleware()
    Server->>MW: setupAllMiddleware(options)
    MW->>MW: setupCors()
    MW->>MW: setupJsonParser()
    MW->>MW: setupBrandingHeaders()
    MW->>MW: setupRequestLogging()
    MW->>MW: setupErrorHandler()
    Server->>Server: setupRoutes()
    Server->>Routes: setupSystemRoutes()
    Routes->>Routes: setupPlaygroundRoute()
    Routes->>Routes: setupHealthCheckRoute()
    Routes->>Routes: setupShareRoute()
    Routes->>Routes: setupGalleryRoute()
    Server->>Server: start()
    Server-->>User: Server running on port 3000
```

### Configuration Loading Flow

```mermaid
flowchart TD
    Start[Start] --> LoadFile[Load Schema File]
    LoadFile --> ParseJSON[Parse JSON]
    ParseJSON --> ValidateSchema{Validate Schema?}
    ValidateSchema -->|Yes| ValidateOptions[Validate Server Options]
    ValidateSchema -->|No| Error1[Throw ValidationError]
    ValidateOptions -->|Valid| CreateConfig[Create MockServerConfig]
    ValidateOptions -->|Invalid| Error2[Throw ConfigurationError]
    CreateConfig --> CreateServer[Create ServerGenerator]
    CreateServer --> Setup[Setup Middleware & Routes]
    Setup --> Start[Start Server]
    Start --> Success[Server Ready]
    Error1 --> Fail[Initialization Failed]
    Error2 --> Fail
```

### Route Registration Flow

```mermaid
flowchart TD
    Start[Start Registration] --> CheckCustom{Has x-schemock-routes?}
    CheckCustom -->|Yes| GenerateCustom[Generate Custom Routes]
    CheckCustom -->|No| GenerateCRUD[Generate CRUD Routes]

    GenerateCustom --> ForEach[Iterate Route Definitions]
    GenerateCRUD --> ForEach

    ForEach --> CreateHandler[Create Route Handler]
    CreateHandler --> Register[Register with Express]
    Register --> MoreRoutes{More Routes?}
    MoreRoutes -->|Yes| ForEach
    MoreRoutes -->|No| SystemRoutes[Setup System Routes]
    SystemRoutes --> Complete[Registration Complete]
```

## Request Lifecycle

### HTTP Request Flow

```mermaid
sequenceDiagram
    participant Client as HTTP Client
    participant Express as Express.js
    participant CORS as CORS Middleware
    participant JSON as JSON Parser
    participant Log as Request Logger
    participant Route as Route Handler
    participant Parser as Schema Parser
    participant Cache as LRU Cache
    participant Brand as Branding
    participant ResLogger as Response Logger
    participant Err as Error Handler

    Client->>Express: HTTP GET /api/users
    Express->>CORS: Check CORS headers
    CORS->>JSON: Forward request
    JSON->>Log: Log incoming request
    Log->>Route: Call route handler
    Route->>Parser: parse(schema, options)
    Parser->>Cache: Check cache key
    Cache-->>Parser: Cache miss
    Parser->>Parser: Generate mock data
    Parser-->>Route: Return mock data
    Route->>Brand: Add branding metadata
    Brand->>ResLogger: Log response
    ResLogger-->>Express: Return response
    Express-->>Client: HTTP 200 + JSON body
```

### Request Processing Pipeline

```mermaid
graph LR
    subgraph "Middleware Pipeline"
        In[Incoming Request]
        CORS1[CORS Check]
        JSON1[JSON Parse]
        Log1[Request Log]
        Handler[Route Handler]
        Brand1[Add Branding]
        Log2[Response Log]
        Out[Outgoing Response]
    end

    In --> CORS1
    CORS1 --> JSON1
    JSON1 --> Log1
    Log1 --> Handler
    Handler --> Brand1
    Brand1 --> Log2
    Log2 --> Out
```

### Middleware Execution Order

| Order | Middleware | Purpose | Can Modify |
|--------|-----------|---------|-------------|
| 1 | CORS | Add CORS headers | Request, Response |
| 2 | JSON Parser | Parse request body | Request |
| 3 | Branding Headers | Add X-Powered-By header | Response |
| 4 | Request Logging | Log incoming request | None (logging only) |
| 5 | Error Handler | Catch and handle errors | Response |

**ADR-013: Middleware Order Matters**
**Decision**: Middleware is applied in a specific order for correct behavior.

**Rationale**:

- CORS must come first for pre-flight OPTIONS requests
- JSON parser needed before route handlers access body
- Request logging captures all requests before processing
- Error handler must be last to catch all errors

## Schema Parsing Flow

### Schema Parse Flow

```mermaid
flowchart TD
    Start[Start Parse] --> CheckCache{Check Cache}
    CheckCache -->|Hit| ReturnCached[Return Cached Result]
    CheckCache -->|Miss| CheckRef{Has $ref?}
    CheckRef -->|Yes| ResolveRef[Resolve $ref]
    CheckRef -->|No| CheckComp{Has Composition?}
    ResolveRef --> CheckComp

    CheckComp -->|oneOf| OneOf[Pick Random oneOf]
    CheckComp -->|anyOf| AnyOf[Pick Random anyOf]
    CheckComp -->|allOf| AllOf[Merge allOf]
    CheckComp -->|No| ParseType[Parse by Type]

    OneOf --> ParseType
    AnyOf --> ParseType
    AllOf --> ParseType

    ParseType --> TypeSwitch{Schema Type}
    TypeSwitch -->|string| GenString[Generate String]
    TypeSwitch -->|number| GenNumber[Generate Number]
    TypeSwitch -->|integer| GenInt[Generate Integer]
    TypeSwitch -->|boolean| GenBool[Generate Boolean]
    TypeSwitch -->|array| GenArray[Generate Array]
    TypeSwitch -->|object| GenObject[Generate Object]
    TypeSwitch -->|null| GenNull[Return Empty Object]

    GenString --> StoreCache[Store in Cache]
    GenNumber --> StoreCache
    GenInt --> StoreCache
    GenBool --> StoreCache
    GenArray --> StoreCache
    GenObject --> StoreCache
    GenNull --> StoreCache

    StoreCache --> Return[Return Result]
    ReturnCached --> Return
```

### Schema Reference Resolution

```mermaid
sequenceDiagram
    participant Parser as SchemaParser
    participant Schema as Input Schema
    participant Visited as Visited Set
    participant Root as Root Schema
    participant Cache as LRU Cache

    Parser->>Schema: Parse schema with $ref
    Parser->>Visited: Check if ref visited
    Visited-->>Parser: Not visited
    Parser->>Visited: Add ref to visited
    Parser->>Root: Navigate to ref path
    Root-->>Parser: Return resolved schema
    Parser->>Parser: Parse resolved schema
    Parser->>Visited: Remove ref from visited
    Parser->>Cache: Store result
    Cache-->>Parser: Confirmation
    Parser-->>Parser: Return result
```

### Circular Reference Handling

```mermaid
flowchart TD
    Start[Start Parse $ref] --> CheckVisited{Ref in Visited?}
    CheckVisited -->|Yes| Warn[Log Circular Warning]
    Warn --> ReturnEmpty[Return Empty Object]
    CheckVisited -->|No| Navigate[Navigate Schema Path]
    Navigate --> Valid{Path Valid?}
    Valid -->|No| ThrowError[Throw SchemaRefError]
    Valid -->|Yes| CheckType{Is Schema?}
    CheckType -->|No| ThrowError
    CheckType -->|Yes| AddVisited[Add to Visited]
    AddVisited --> ParseRecursive[Parse Recursively]
    ParseRecursive --> RemoveVisited[Remove from Visited]
    RemoveVisited --> Return[Return Result]
```

## Mock Data Generation Flow

### String Generation Flow

```mermaid
flowchart TD
    Start[Generate String] --> CheckEnum{Has enum?}
    CheckEnum -->|Yes| PickEnum[Pick Random Enum Value]
    CheckEnum -->|No| CheckPropName{Has Property Name?}
    PickEnum --> ReturnEnum[Return Enum Value]

    CheckPropName -->|Yes| CheckHeuristic{Match Heuristic?}
    CheckPropName -->|No| CheckFormat{Has Format?}

    CheckHeuristic -->|email| Email[Generate Email]
    CheckHeuristic -->|uuid| UUID[Generate UUID]
    CheckHeuristic -->|date-time| DateTime[Generate ISO Date]
    CheckHeuristic -->|name| Name[Pick Random Name]
    CheckHeuristic -->|other| CheckFormat

    CheckFormat -->|date| Date[Generate Date]
    CheckFormat -->|time| Time[Generate Time]
    CheckFormat -->|uri| URI[Generate URL]
    CheckFormat -->|ipv4| IPv4[Generate IP Address]
    CheckFormat -->|other| CheckPattern{Has Pattern?}

    CheckPattern -->|Yes| MatchPattern[Match Simple Pattern]
    CheckPattern -->|No| CheckLength{Has Constraints?}

    CheckLength -->|Yes| GenLength[Generate with Length]
    CheckLength -->|No| GenDefault[Generate Default String]

    Email --> ReturnString[Return String]
    UUID --> ReturnString
    DateTime --> ReturnString
    Name --> ReturnString
    Date --> ReturnString
    Time --> ReturnString
    URI --> ReturnString
    IPv4 --> ReturnString
    MatchPattern --> ReturnString
    GenLength --> ReturnString
    GenDefault --> ReturnString
    ReturnEnum --> ReturnString
```

### Number Generation Flow

```mermaid
flowchart TD
    Start[Generate Number] --> CheckPropName{Has Property Name?}
    CheckPropName -->|Yes| CheckHeuristic{Match Heuristic?}
    CheckPropName -->|No| CheckConstraints{Has Constraints?}

    CheckHeuristic -->|age| Age[Generate 18-78]
    CheckHeuristic -->|price| Price[Generate 0-100]
    CheckHeuristic -->|year| Year[Generate 1970-2030]
    CheckHeuristic -->|rating| Rating[Generate 0-5]
    CheckHeuristic -->|other| CheckConstraints

    CheckConstraints -->|HasMultipleOf{Has multipleOf?}
    HasMultipleOf -->|Yes| CalcSteps[Calculate Steps]
    HasMultipleOf -->|No| CheckBounds{Has Bounds?}

    CalcSteps --> GenMultiple[Generate Multiple of Step]
    GenMultiple --> ReturnNum[Return Number]

    CheckBounds -->|Yes| ApplyBounds[Apply Min/Max]
    CheckBounds -->|No| GenDefault[Generate Default Range]

    ApplyBounds --> CheckExclusive{Has Exclusive Bounds?}
    CheckExclusive -->|Yes| AdjustExclusive[Adjust for Exclusive]
    CheckExclusive -->|No| ReturnNum
    AdjustExclusive --> ReturnNum

    Age --> ReturnNum
    Price --> ReturnNum
    Year --> ReturnNum
    Rating --> ReturnNum
    GenDefault --> ReturnNum
```

### Array Generation Flow

```mermaid
flowchart TD
    Start[Generate Array] --> CheckItems{Has Items?}
    CheckItems -->|No| ReturnEmpty[Return Empty Array]
    CheckItems -->|Yes| CheckTuple{Is Tuple?}

    CheckTuple -->|Yes| GenTuple[Generate Tuple Items]
    CheckTuple -->|No| CheckLength{Has Length Constraints?}

    CheckLength -->|Yes| CalcCount[Calculate Count]
    CheckLength -->|No| GenDefault[Generate Default Count]

    CalcCount --> Loop[Loop Count Times]
    GenDefault --> Loop

    Loop --> ParseItem[Parse Item Schema]
    ParseItem --> AddItem[Add to Array]
    AddItem --> MoreItems{More Items?}
    MoreItems -->|Yes| Loop
    MoreItems -->|No| ReturnArr[Return Array]

    GenTuple --> ReturnArr
    ReturnEmpty --> ReturnArr
```

### Object Generation Flow

```mermaid
flowchart TD
    Start[Generate Object] --> CheckProps{Has Properties?}
    CheckProps -->|No| ReturnEmpty[Return Empty Object]
    CheckProps -->|No| ReturnEmpty

    CheckProps -->|Yes| InitObj[Initialize Object]
    InitObj --> LoopProps[Loop Properties]

    LoopProps --> CheckRequired{Is Required?}
    CheckRequired -->|Yes| AddRequired[Add Property]
    CheckRequired -->|No| CheckOptional{Include Optional?}

    AddRequired --> ParseProp[Parse Property Schema]
    CheckOptional -->|90% Chance| AddOptional[Add Property]
    CheckOptional -->|10% Chance| SkipProp[Skip Property]

    ParseProp --> AddOptional
    SkipProp --> MoreProps{More Properties?}
    AddOptional --> MoreProps

    MoreProps -->|Yes| LoopProps
    MoreProps -->|No| CheckAdditional{Has Additional Props?}

    CheckAdditional -->|Yes| LoopAdditional[Loop 0-2 Times]
    CheckAdditional -->|No| ReturnObj[Return Object]

    LoopAdditional --> GenExtra[Generate Extra Property]
    GenExtra --> AddExtra[Add to Object]
    AddExtra --> MoreAdditional{More Extras?}
    MoreAdditional -->|Yes| LoopAdditional
    MoreAdditional -->|No| ReturnObj
```

## Response Flow

### Response Preparation Flow

```mermaid
flowchart TD
    Start[Prepare Response] --> CheckType{Response Type?}
    CheckType -->|Function| CallHandler[Call Handler Function]
    CheckType -->|Schema| ParseSchema[Parse Schema]
    CheckType -->|Static| UseStatic[Use Static Value]

    CallHandler --> GetResult[Get Handler Result]
    ParseSchema --> GetResult
    UseStatic --> GetResult

    GetResult --> CheckBranding{Hide Branding?}
    CheckBranding -->|Yes| SkipBrand[Skip Branding]
    CheckBranding -->|No| CheckObject{Is Object?}

    SkipBrand --> ReturnResp[Return Response]
    CheckObject -->|Yes| AddMeta[Add _meta Metadata]
    CheckObject -->|No| ReturnResp

    AddMeta --> ReturnResp
```

### Branding Addition Flow

```mermaid
flowchart TD
    Start[Add Branding] --> CheckHide{hideBranding?}
    CheckHide -->|Yes| ReturnOriginal[Return Original Data]
    CheckHide -->|No| CheckType{Data Type?}

    CheckType -->|Not Object| ReturnOriginal[Return Original Data]
    CheckType -->|Array| ReturnOriginal
    CheckType -->|Object| CheckMeta{Has _meta?}

    CheckMeta -->|Yes| ReturnOriginal[Return Original Data]
    CheckMeta -->|No| CreateMeta[Create Metadata Object]

    CreateMeta --> Merge[Merge with Original]
    Merge --> Return[Return Branded Data]
```

## Error Flow

### Error Handling Flow

```mermaid
sequenceDiagram
    participant Client as HTTP Client
    participant Express as Express.js
    participant Route as Route Handler
    participant Validator as Request Validator
    participant Err as Error Handler
    participant Logger as Logger

    Client->>Express: HTTP Request
    Express->>Route: Call handler
    Route->>Validator: Validate request (strict mode)
    Validator-->>Route: Validation passed
    Route->>Route: Process request
    Route->>Route: Generate response

    alt Error Occurs
        Route->>Err: Throw error
        Err->>Logger: Log error with context
        Err->>Express: Send error response
        Express-->>Client: HTTP 500 + Error JSON
    else Success
        Route-->>Express: Return response
        Express-->>Client: HTTP 200 + Response JSON
    end
```

### Validation Error Flow

```mermaid
flowchart TD
    Start[Validate Data] --> CheckRequired{Check Required Fields}
    CheckRequired -->|Missing| ThrowRequired[Throw ValidationError]
    CheckRequired -->|Present| CheckType{Check Type}

    CheckType -->|Mismatch| ThrowType[Throw ValidationError]
    CheckType -->|Match| CheckString{Is String?}

    CheckString -->|Yes| CheckLength{Check Length Constraints}
    CheckString -->|No| CheckNumber{Is Number?}

    CheckLength -->|TooShort| ThrowMin[Throw ValidationError]
    CheckLength -->|TooLong| ThrowMax[Throw ValidationError]
    CheckLength -->|Valid| CheckNumber

    CheckNumber -->|Yes| CheckRange{Check Range}
    CheckNumber -->|No| CheckObject{Is Object?}

    CheckRange -->|TooSmall| ThrowMin[Throw ValidationError]
    CheckRange -->|TooLarge| ThrowMax[Throw ValidationError]
    CheckRange -->|Valid| CheckObject

    CheckObject -->|Yes| Recurse[Validate Properties]
    CheckObject -->|No| ReturnValid[Return Valid]

    Recurse --> CheckObject

    ThrowRequired --> Fail[Validation Failed]
    ThrowType --> Fail
    ThrowMin --> Fail
    ThrowMax --> Fail
    ReturnValid --> Success[Validation Passed]
```

## Cache Flow

### Cache Lookup Flow

```mermaid
flowchart TD
    Start[Cache Lookup] --> GenerateKey[Generate Cache Key]
    GenerateKey --> CheckExists{Key Exists?}
    CheckExists -->|No| ReturnMiss[Return undefined]
    CheckExists -->|Yes| CheckTTL{Has TTL?}

    CheckTTL -->|Yes| CheckExpired{Is Expired?}
    CheckTTL -->|No| CheckTTL

    CheckExpired -->|Yes| DeleteEntry[Delete Entry]
    DeleteEntry --> ReturnMiss
    CheckTTL -->|No| MoveToFront[Move to Front]

    MoveToFront --> CheckTTL

    CheckTTL -->|Yes| UpdateTimestamp[Update Timestamp]
    UpdateTimestamp --> ReturnHit[Return Cached Value]
    CheckTTL -->|No| ReturnHit

    ReturnMiss --> End[End]
    ReturnHit --> End
```

### Cache Storage Flow

```mermaid
flowchart TD
    Start[Cache Store] --> CheckExists{Key Exists?}
    CheckExists -->|Yes| UpdateValue[Update Value]
    CheckExists -->|No| CreateNode[Create New Node]

    UpdateValue --> UpdateTimestamp[Update Timestamp]
    UpdateTimestamp --> MoveToFront[Move to Front]

    CreateNode --> AddToMap[Add to Map]
    AddToMap --> LinkHead[Link to Head]

    MoveToFront --> CheckCapacity{At Capacity?}
    LinkHead --> CheckCapacity

    CheckCapacity -->|Yes| EvictTail[Evict Tail Node]
    CheckCapacity -->|No| End[End]

    EvictTail --> RemoveFromMap[Remove from Map]
    RemoveFromMap --> UnlinkTail[Unlink Tail]
    UnlinkTail --> LinkNew[Link New Node to Head]
    LinkNew --> End
```

### LRU Eviction Flow

```mermaid
flowchart TD
    Start[Eviction Triggered] --> CheckTail{Has Tail?}
    CheckTail -->|No| End[End]
    CheckTail -->|Yes| GetTailKey[Get Tail Key]

    GetTailKey --> RemoveFromMap[Remove from Map]
    RemoveFromMap --> UnlinkTail[Unlink Tail Node]
    UnlinkTail --> UpdateHead[Update Head Pointer]
    UpdateHead --> UpdateTail[Update Tail Pointer]

    UpdateTail --> CheckHead{Was Head?}
    CheckHead -->|Yes| SetNull[Set Head to null]
    CheckHead -->|No| End

    SetNull --> SetNull[Set Tail to null]
    SetNull --> End
```

## Complete Request-Response Flow

```mermaid
sequenceDiagram
    participant Client as HTTP Client
    participant MW as Middleware
    participant Route as Route Handler
    participant Parser as Schema Parser
    participant Cache as LRU Cache
    participant State as Server State
    participant Logger as Logger

    Client->>MW: HTTP GET /api/users
    MW->>MW: CORS check
    MW->>MW: JSON parse
    MW->>MW: Log request
    MW->>Route: Call handler

    Route->>State: Get resource state
    State-->>Route: Return state array

    Route->>Parser: Parse schema
    Parser->>Cache: Check cache
    Cache-->>Parser: Cache miss
    Parser->>Parser: Generate mock data
    Parser->>Cache: Store result
    Parser-->>Route: Return data

    Route->>State: Update state (if needed)
    Route->>MW: Return response

    MW->>MW: Add branding
    MW->>MW: Log response
    MW-->>Client: HTTP 200 + JSON

    Logger->>Logger: Log complete request
```

---

**Related Documents**:

- [System Overview](./01-system-overview.md) - High-level architecture
- [Component Architecture](./02-component-architecture.md) - Component details
- [Middleware Layer](./05-middleware-layer.md) - Middleware details
- [State Management](./08-state-management.md) - State handling

**Last Updated**: 2026-01-09
